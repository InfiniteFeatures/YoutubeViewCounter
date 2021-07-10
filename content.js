'use strict';

{
    let viewCount = 0;
    let ui_init = false;
    let video_init = false;

    let videoId = window.location.search.split('v=')[1]?.split('&')[0] || "";
    console.log("curr search:", videoId);

    let count_span = document.createElement("span");
    count_span.textContent = "0";

    const updateViewCountUI = function () {
        count_span.textContent = "" + viewCount;
    }

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

        getViewCountStorage(updateViewCountUI);

        ui_init = true;
    }

    ////////////
    // Storage

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

    const initVideoEvents = function(video) {
        video.addEventListener("ended", onVideoEnd);
        video.addEventListener("seeking", onVideoSeeking);
        video.addEventListener("timeupdate", onVideoTimeUpdate);
        
        video_init = true;
    }
    
    ///////////
    // Extension events

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message === 'video') {
            videoId = request.url.split('v=')[1].split('&')[0];
            if (ui_init) {
                getViewCountStorage(updateViewCountUI);
            }
        }
    });

    ////////
    // Setup page

    const info_strings = document.querySelector("#info-strings");
    if (info_strings) {
        initUI(info_strings);
    }

    const video = document.querySelector("video");
    if (video) {
        initVideoEvents(video);
    }

    if (!ui_init || !video_init) {
        const observer = new MutationObserver(function (mutations, mo) {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!ui_init && node.classList && node.classList.contains("ytd-video-primary-info-renderer")) {
                        const info_strings = node.querySelector("#info-strings");
                        if (info_strings) {
                            initUI(info_strings);
                            if (video_init) {
                                mo.disconnect();
                                return;
                            }
                        }
                    }
                    if (!video_init && node.tagName === "VIDEO") {
                        initVideoEvents(node);
                        if (ui_init) {
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
}