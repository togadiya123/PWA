var deferredPrompt;
const enableNotificationsButton = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
    window.Promise = Promise;
}

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

const displayConfirmNotification = () => {
    if ('serviceWorker' in navigator) {
        const options = {
            body: 'You\'ve subscribed to my notifications service from SW.',
            icon: '/src/images/icons/app-icon-96x96.png',
            image: '/src/images/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-US',
            variant: [100,50,200],
            badge: '/src/images/icons/app-icon-96x96.png',
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
                { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
            ]
        }
        navigator.serviceWorker.ready.then(async (sw) => {
            await sw.showNotification('You subscribed to notifications!', options);
            // new Notification('You subscribed to notifications!', options);
        });
    }
}

const configurePushSubscription = () => {
    if('serviceWorker' in navigator) {
        return;
    }
    navigator.serviceWorker.ready.then(async (sw) => {
        const sub = await sw.pushManager.getSubscription();
        if(sub) {

        } else {
            await sw.pushManager.subscribe({userVisibleOnly : true});
        }
    })
}

const askForNotificationPermission = () => {
    Notification.requestPermission().then((result) => {
        if (result === 'granted') {
            console.log('Notification permission granted.');
            // displayConfirmNotification();
            configurePushSubscription();
        } else {
            console.log('Notification permission denied.');
        }
    })
}

if ('Notification' in window) {
    console.log({enableNotificationsButton});
    for (let i = 0; i < enableNotificationsButton.length; i++) {
        enableNotificationsButton[i].style.display = 'inline-block';
        enableNotificationsButton[i].addEventListener('click', askForNotificationPermission);
    }
}