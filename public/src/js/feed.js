const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
const sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerArea = document.querySelector('#pick-image');
let picture;
const locationBtn = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');
let fetchedLocation = {lat: 0, lng: 0};

locationBtn.addEventListener('click', function () {
    if (!('geolocation' in navigator)) {
        return;
    }
    let sawAlert = false;

    locationBtn.style.display = 'none';
    locationLoader.style.display = 'block';

    navigator.geolocation.getCurrentPosition(function (position) {
        locationBtn.style.display = 'inline';
        locationLoader.style.display = 'none';
        // console.log({position});
        fetchedLocation = {lat: position.coords.latitude, lng: position.coords.longitude};
        locationInput.value = 'In Somewhere';
        document.querySelector('#manual-location').classList.add('is-focused');
    }, function (err) {
        // console.log(err);
        locationBtn.style.display = 'inline';
        locationLoader.style.display = 'none';
        if (!sawAlert) {
            alert('Couldn\'t fetch location, please enter manually!');
            sawAlert = true;
        }
        fetchedLocation = {lat: 0, lng: 0};
    }, {timeout: 7000});
});

function initializeLocation() {
    if (!('geolocation' in navigator)) {
        locationBtn.style.display = 'none';
    }
}

function initializeMedia() {
    if (!('mediaDevices' in navigator)) {
        navigator.mediaDevices = {};
    }

    if (!('getUserMedia' in navigator.mediaDevices)) {
        navigator.mediaDevices.getUserMedia = function (constraints) {
            const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented!'));
            }

            return new Promise(function (resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    }

    navigator.mediaDevices.getUserMedia({video: true})
        .then(function (stream) {
            videoPlayer.srcObject = stream;
            videoPlayer.style.display = 'block';
        })
        .catch(function () {
            imagePickerArea.style.display = 'block';
        });
}

captureButton.addEventListener('click', function () {
    canvasElement.style.display = 'block';
    videoPlayer.style.display = 'none';
    captureButton.style.display = 'none';
    const context = canvasElement.getContext('2d');
    context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
        track.stop();
    });
    picture = canvasElement.toDataURL();
});

imagePicker.addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        picture = reader.result
    };
    reader.readAsDataURL(file);
});

function openCreatePostModal() {
    setTimeout(function () {
        createPostArea.style.transform = 'translateY(0)';
    }, 1);
    initializeMedia();
    initializeLocation();
    if (deferredPrompt) {
        deferredPrompt.prompt();

        deferredPrompt.userChoice.then(function (choiceResult) {

            if (choiceResult.outcome === 'dismissed') {
                // console.log('User cancelled installation');
            } else {
                // console.log('User added to home screen');
            }
        });

        deferredPrompt = null;
    }
}

function closeCreatePostModal() {
    imagePickerArea.style.display = 'none';
    videoPlayer.style.display = 'none';
    canvasElement.style.display = 'none';
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    captureButton.style.display = 'inline';
    if (videoPlayer.srcObject) {
        videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
            track.stop();
        });
    }
    setTimeout(function () {
        createPostArea.style.transform = 'translateY(100vh)';
    }, 1);
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCards() {
    while (sharedMomentsArea.hasChildNodes()) {
        sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
}

function createCard(data) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
    const cardTitle = document.createElement('div');
    cardTitle.className = 'mdl-card__title';
    cardTitle.style.backgroundImage = 'url(' + data.image + ')';
    cardTitle.style.backgroundSize = 'cover';
    cardWrapper.appendChild(cardTitle);
    const cardTitleTextElement = document.createElement('h2');
    cardTitleTextElement.style.color = 'white';
    cardTitleTextElement.className = 'mdl-card__title-text';
    cardTitleTextElement.textContent = data.title;
    cardTitle.appendChild(cardTitleTextElement);
    const cardSupportingText = document.createElement('div');
    cardSupportingText.className = 'mdl-card__supporting-text';
    cardSupportingText.textContent = data.location;
    cardSupportingText.style.textAlign = 'center';
    cardWrapper.appendChild(cardSupportingText);
    componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
    clearCards();
    for (let i = 0; i < data.length; i++) {
        createCard(data[i]);
    }
}

const url = 'https://pwa-gram-358111-default-rtdb.firebaseio.com/posts.json';
let networkDataReceived = false;

fetch(url)
    .then(function (res) {
        return res.json();
    })
    .then(function (data) {
        networkDataReceived = true;
        const dataArray = [];
        for (let key in data) {
            dataArray.push(data[key]);
        }
        updateUI(dataArray);
    });

if ('indexedDB' in window) {
    readAllData('posts')
        .then(function (data) {
            if (!networkDataReceived) {
                updateUI(data);
            }
        });
}

const sendData = async () => {

    fetch('https://pwa-gram-358111-default-rtdb.firebaseio.com/posts.json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            id: new Date().toISOString(),
            title: titleInput.value,
            location: locationInput.value,
            image: picture,
        })
    })
        .then(function (res) {
            updateUI();
        })
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
        alert('Please enter valid data!');
        return;
    }

    closeCreatePostModal();

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
            .then(function (sw) {
                const post = {
                    id: new Date().toISOString(),
                    title: titleInput.value,
                    location: locationInput.value,
                    picture: picture,
                    rawLocation: fetchedLocation
                };
                writeData('sync-posts', post)
                    .then(function () {
                        return sw.sync.register('sync-new-posts');
                    })
                    .then(function () {
                        const snackbarContainer = document.querySelector('#confirmation-toast');
                        const data = {message: 'Your Post was saved for syncing!'};
                        snackbarContainer.MaterialSnackbar?.showSnackbar(data);
                    })
                    .catch(function (err) {
                        // console.log(err);
                    });
            });
    } else {
        await sendData();
    }
});