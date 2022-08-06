let deferredPrompt;
const enableNotificationsButton = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
    window.Promise = Promise;
}


/* Adding SW in device. */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js')
        .then(function () {
            console.log('Service worker registered!');
        })
        .catch(function (err) {
            console.log(err);
        });
}

window.addEventListener('beforeinstallprompt', function (event) {
    console.log('beforeinstallprompt fired');
    event.preventDefault();
    deferredPrompt = event;
    return false;
});


/* Notification when user give permission for push notification  */
const displayConfirmNotification = () => {
    if ('serviceWorker' in navigator) {
        const options = {
            body: 'You\'ve subscribed to my notifications service.',
            icon: '/src/images/icons/app-icon-96x96.png',
            dir: 'ltr',
            lang: 'en-US',
            variant: [100, 50, 200],
            badge: '/src/images/icons/app-icon-96x96.png',
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                {action: 'confirm', title: 'Okay'},
                {action: 'cancel', title: 'Cancel'}
            ]
        }
        navigator.serviceWorker.ready.then(async (sw) => {
            await sw.showNotification('You subscribed to notifications!', options);
            // new Notification('You subscribed to notifications!', options);
        });
    }
}

/* Asking notification permission. */
const askForNotificationPermission = () => {
    try {
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

        const vapidKey = "BO_tIZ75ghZQoYa5UhTRg0JlGEmyDUyLgQzhAkjBumCrtbYdCq1PRr8Dx56b95deSCKoXf3TpmZy0bQqukVDgtI"

        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();
        messaging.requestPermission().then(async () => {
            const token = await messaging.getToken(vapidKey);
            await fetch('https://pwa-gram-358111-default-rtdb.firebaseio.com/tokens.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({token})
            }).then(function (res) {
                displayConfirmNotification();
            })
        })
    } catch (err) {

    }
}

if ('Notification' in window) {
    console.log({enableNotificationsButton});
    for (let i = 0; i < enableNotificationsButton.length; i++) {
        enableNotificationsButton[i].style.display = 'inline-block';
        enableNotificationsButton[i].addEventListener('click', askForNotificationPermission);
    }
}