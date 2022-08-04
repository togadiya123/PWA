importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-analytics.js');
importScripts('https://www.gstatic.com/firebasejs/7.18.0/firebase-messaging.js');

var CACHE_STATIC_NAME = 'static-v23';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/idb.js',
    '/src/js/promise.js',
    '/src/js/fetch.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then(function (cache) {
//       return cache.keys()
//         .then(function (keys) {
//           if (keys.length > maxItems) {
//             cache.delete(keys[0])
//               .then(trimCache(cacheName, maxItems));
//           }
//         });
//     })
// }

self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installing Service Worker ...', event);
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME)
            .then(function (cache) {
                console.log('[Service Worker] Precaching App Shell');
                cache.addAll(STATIC_FILES);
            })
    )
});

self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activating Service Worker ....', event);
    event.waitUntil(
        caches.keys()
            .then(function (keyList) {
                return Promise.all(keyList.map(function (key) {
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        console.log('[Service Worker] Removing old cache.', key);
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});

function isInArray(string, array) {
    var cachePath;
    if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
        console.log('matched ', string);
        cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    } else {
        cachePath = string; // store the full request (for CDNs)
    }
    return array.indexOf(cachePath) > -1;
}

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
            })
        );
    } else if (isInArray(event.request.url, STATIC_FILES)) {
        event.respondWith(
            caches.match(event.request)
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(function (response) {
                    if (response) {
                        return response;
                    } else {
                        return fetch(event.request)
                            .then(function (res) {
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(function (cache) {
                                        // trimCache(CACHE_DYNAMIC_NAME, 3);
                                        if (
                                            !(res.url.startsWith('chrome-extension') ||
                                                res.url.includes('extension') ||
                                                !(res.url.indexOf('http') === 0))
                                        )
                                            cache.put(event.request.url, res.clone()).then();
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
                })
        );
    }
});

const sendMsg = async ({token}) => {
    console.log({token});
    await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAAu8FFrfU:APA91bGRpvDT6lT9wI4goIa70gK7durQ69wgKzS2QhWjP3Ktp45ns3e_OpegOkXJ74NFSoePPgKCndWJQ9CvRYxhHobUpaZN_D-NuvO422F2Y4bI6b0dRbpnctlGHzEts9rsj56tWfI0',
        },
        body: JSON.stringify({
            "to" : token,
            "notification" : {
                "title" : "Testing"
            }
        }),
    })
}

const sendNotification = async (data) => {

    const firebaseConfig = {
        apiKey: "AIzaSyBOdSFywm10P194ktby-a-1DkZV9ZUHMOA",
        authDomain: "pwa-gram-358111.firebaseapp.com",
        databaseURL: "https://pwa-gram-358111-default-rtdb.firebaseio.com",
        projectId: "pwa-gram-358111",
        storageBucket: "pwa-gram-358111.appspot.com",
        messagingSenderId: "806401453557",
        appId: "1:806401453557:web:1a2a2a8221a840fd8384bc",
        measurementId: "G-5TC1R7V843"
    };

    const tokens = await fetch('https://pwa-gram-358111-default-rtdb.firebaseio.com/tokens.json', {
        method: 'GET',
    });

    await tokens.json().then(data => {
        return Object.keys(data).forEach(async (key) => {
            await sendMsg({data, token: data[key].token});
        })
    });


    // const message = {
    //     notification: {
    //         title: data.title
    //     },
    //     tokens : tokenArray
    // };
    //
    // const vapidKey = "BO_tIZ75ghZQoYa5UhTRg0JlGEmyDUyLgQzhAkjBumCrtbYdCq1PRr8Dx56b95deSCKoXf3TpmZy0bQqukVDgtI"
    // firebase.initializeApp(firebaseConfig);
    // const messaging = firebase.messaging();
    // console.log({firebase,messaging })

    //
    // console.log({messaging,message,tokenArray,firebase});

    // getMessaging().send(message).then((res)=> {
    //     console.log({res});
    // }).catch(err => {
    //     console.log({err});
    // });
}

self.addEventListener('sync', function (event) {
    console.log('[Service Worker] Background syncing', event);
    if (event.tag === 'sync-new-posts') {
        console.log('[Service Worker] Syncing new Posts');
        event.waitUntil(
            readAllData('sync-posts')
                .then(function (data) {
                    for (let dt of data) {
                        fetch('https://pwa-gram-358111-default-rtdb.firebaseio.com/posts.json', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({
                                id: dt.id,
                                title: dt.title,
                                location: dt.location,
                                image: 'https://firebasestorage.googleapis.com/v0/b/pwa-gram-358111.appspot.com/o/Doctor%20Strange%2C%20yin%20yuming.png?alt=media&token=0042a519-c28e-4aa7-8d01-84f5b0ea324d'
                            })
                        })
                            .then(function (res) {
                                sendNotification(dt);
                                if (res.ok) {
                                    deleteItemFromData('sync-posts', dt.id); // Isn't working correctly!
                                }
                            })
                            .catch(function (err) {
                                console.log('Error while sending data', err);
                            });
                    }

                })
        );
    }
});
