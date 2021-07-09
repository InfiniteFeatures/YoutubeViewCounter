'use strict';

{
    let viewCount = 0;

    let videoId = window.location.search.split('v=')[1].split('&')[0];
    console.log("curr search:", videoId);

    let count_span = document.createElement("span");
    count_span.textContent = "0";

    const updateViewCountUI = function () {
        count_span.textContent = "" + viewCount;
    }

    const setViewCountStorage = function () {
        chrome.storage.local.set({ [videoId]: viewCount });
    }

    const getViewCountStorage = function (callback) {
        chrome.storage.local.get(videoId, (result) => {
            if (chrome.runtime.lastError) {
                viewCount = 0;
                console.log('Error getting viewcount from storage: ', result, viewCount);
            } else {
                viewCount = result[videoId] || 0;
                console.log('Got viewcount from storage: ', result, viewCount);
            }
            callback();
        });
    }
    getViewCountStorage(updateViewCountUI);


    const incrementViewCount = function () {
        getViewCountStorage(() => {
            viewCount++;
            updateViewCountUI();
            setViewCountStorage();
        });
    }

    const initUI = function (info_strings) {
        let display_str = document.createElement("yt-formatted-string");
        display_str.classList.add("style-scope", "ytd-video-primary-info-renderer");

        info_strings.appendChild(display_str); //Need to insert the node before modifying the content because polymer rendering is weird

        display_str.textContent = "Your views: ";
        display_str.appendChild(count_span);
    }

    ////////
    // Video events

    let videoEnding = false;

    const onVideoEnd = function () {
        videoEnding = false;
        incrementViewCount();
    }

    const onVideoSeeking = function (e) {
        const video = e.target;
        if (video.currentTime === 0 && videoEnding) {
            videoEnding = false;
            incrementViewCount();
        }
    }

    const onVideoTimeUpdate = function (e) {
        const video = e.target;
        if (video.currentTime >= video.duration - 1) {
            videoEnding = true;
        }
    }

    const video = document.querySelector("video");

    video.addEventListener("ended", onVideoEnd);
    video.addEventListener("seeking", onVideoSeeking);
    video.addEventListener("timeupdate", onVideoTimeUpdate);

    ////////
    // Page observer

    const info_strings = document.querySelector("#info-strings");
    if (info_strings) {
        initUI(info_strings);
    } else {
        const observer = new MutationObserver(function (mutations, mo) {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.classList && node.classList.contains("ytd-video-primary-info-renderer")) {
                        const info_strings = node.querySelector("#info-strings");
                        if (info_strings) {
                            initUI(info_strings);
                            mo.disconnect();
                            return;
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    ///////////
    //When everything done, ready to receive messages
    
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message === 'video') {
            videoId = request.url.split('v=')[1].split('&')[0];
            getViewCountStorage(updateViewCountUI);
        }
    });
}