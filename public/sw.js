importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');
importScripts('https://www.gstatic.com/firebasejs/7.7.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.15.5/firebase-analytics.js');
importScripts('https://www.gstatic.com/firebasejs/7.15.5/firebase-messaging.js');

const CACHE_STATIC_NAME = 'static-v23';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';
const STATIC_FILES = ['/', '/index.html', '/offline.html', '/src/js/app.js', '/src/js/feed.js', '/src/js/idb.js', '/src/js/promise.js', '/src/js/fetch.js', '/src/js/material.min.js', '/src/css/app.css', '/src/css/feed.css', '/src/images/main-image.jpg', 'https://fonts.googleapis.com/css?family=Roboto:400,700', 'https://fonts.googleapis.com/icon?family=Material+Icons', 'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'];

/* Event listener would be called when SW install in device. */
self.addEventListener('install', async (event) => {
    console.log('[Service Worker] Installing Service Worker ...', event);
    await event.waitUntil(caches.open(CACHE_STATIC_NAME)
        .then(async (cache) => {
            console.log('[Service Worker] Precaching App Shell');
            await cache.addAll(STATIC_FILES);
        }))
});

/* Event listener would be called when SW activate in device. */
self.addEventListener('activate', async (event) => {
    console.log('[Service Worker] Activating Service Worker ....', event);
    event.waitUntil(caches.keys()
        .then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                    console.log('[Service Worker] Removing old cache.', key);
                    return caches.delete(key);
                }
            }));
        }));
    return self.clients.claim();
});

/* One common function to match the string */
function isInArray(string, array) {
    var cachePath;
    if (string.indexOf(self.origin) === 0) {
        console.log('matched ', string);
        cachePath = string.substring(self.origin.length);
    } else {
        cachePath = string;
    }
    return array.indexOf(cachePath) > -1;
}

/* Event listener would be called when SW fetch a something. */
self.addEventListener('fetch', function (event) {
    console.log({event});
    var url = 'https://pwa-gram-358111-default-rtdb.firebaseio.com/posts.json';
    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(fetch(event.request)
            .then(function (res) {
                var clonedRes = res.clone();
                clearAllData('posts')
                    .then(function () {
                        return clonedRes.json();
                    })
                    .then(function (data) {
                        for (var key in data) {
                            writeData('posts', data[key])
                        }
                    });
                return res;
            }));
    } else if (isInArray(event.request.url, STATIC_FILES)) {
        event.respondWith(caches.match(event.request));
    } else {
        event.respondWith(caches.match(event.request)
            .then(function (response) {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request)
                        .then(function (res) {
                            return caches.open(CACHE_DYNAMIC_NAME)
                                .then(function (cache) {
                                    // trimCache(CACHE_DYNAMIC_NAME, 3);
                                    if (!(res.url.startsWith('chrome-extension') || res.url.includes('extension') || !(res.url.indexOf('http') === 0))) cache.put(event.request.url, res.clone()).then();
                                    return res;
                                })
                        })
                        .catch(function (err) {
                            return caches.open(CACHE_STATIC_NAME)
                                .then(function (cache) {
                                    if (event.request.headers.get('accept').includes('text/html')) {
                                        return cache.match('/offline.html');
                                    }
                                });
                        });
                }
            }));
    }
});

/* Sending Push Notifications. */
const sendMsg = async ({token,post}) => {
    await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST', headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAAu8FFrfU:APA91bGRpvDT6lT9wI4goIa70gK7durQ69wgKzS2QhWjP3Ktp45ns3e_OpegOkXJ74NFSoePPgKCndWJQ9CvRYxhHobUpaZN_D-NuvO422F2Y4bI6b0dRbpnctlGHzEts9rsj56tWfI0',
        }, body: JSON.stringify({
            "to": token,
            "notification": {
                "title": post.title,
                "body": `New Post Added !\n ${post.title} is title of post and post location is ${post.location}.\nClick here to see the post.`,
                "click_action": "http://localhost:8080/",
            }
        }),
    })
}

/* Getting register token and push notification. */
const sendNotification = async (post) => {

    const tokens = await fetch('https://pwa-gram-358111-default-rtdb.firebaseio.com/tokens.json', {
        method: 'GET',
    });

    await tokens.json().then(data => {
        return Object.keys(data || {}).forEach(async (key) => {
            await sendMsg({post, token: data[key].token});
        })
    });
}

/* Event listener would we called when API is syncing. */
self.addEventListener('sync', function (event) {
    console.log('[Service Worker] Background syncing', event);

    if (event.tag === 'sync-new-posts') {
        console.log('[Service Worker] Syncing new Posts');
        event.waitUntil(readAllData('sync-posts')
            .then(async function (data) {
                for (let dt of data) {

                    await fetch('https://pwa-gram-358111-default-rtdb.firebaseio.com/posts.json', {
                        method: 'POST', headers: {
                            'Content-Type': 'application/json', 'Accept': 'application/json'
                        }, body: JSON.stringify({
                            id: dt.id,
                            title: dt.title,
                            location: dt.location,
                            image: dt.picture,
                            rawLocation: dt.rawLocation,
                        })
                    })
                        .then(async function (res) {
                            await sendNotification(dt);
                            if (res.ok) {
                                deleteItemFromData('sync-posts', dt.id);
                            }
                        })
                        .catch(function (err) {
                            console.log('Error while sending data', err);
                        });
                }

            }));
    }
});
