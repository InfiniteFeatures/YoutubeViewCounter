'use strict';

{
    let viewCount = 0;

    let videoId = window.location.search.split('v=')[1];
    let ampersandPosition = videoId.indexOf('&');
    if(ampersandPosition != -1) {
        videoId = videoId.substring(0, ampersandPosition);
    }

    let setViewCount = function() {
        chrome.storage.local.set({[videoId]: viewCount});
    }

    let getViewCount = function() {
        chrome.storage.local.get(videoId, (result) => {
            if (chrome.runtime.lastError) {
                viewCount = 0;
                console.log('Error getting viewcount from storage: ', result, viewCount);
            } else {
                viewCount = result[videoId] || 0;
                console.log('Got viewcount from storage: ', result, viewCount);
            }
            updateViewCount();
        });
    }
    getViewCount();

    let count_span = document.createElement("span");
    count_span.textContent = "0";

    let updateViewCount = function() {
        count_span.textContent = "" + viewCount;
    }

    let incrementViewCount = function() {
        viewCount++;
        updateViewCount();
        setViewCount();
    }

    let init = function(info_strings) {
        let display_str = document.createElement("yt-formatted-string");
        display_str.classList.add("style-scope", "ytd-video-primary-info-renderer");

        info_strings.appendChild(display_str); //Need to insert the node before modifying the content because polymer rendering is weird

        display_str.textContent = "Your views: ";
        display_str.appendChild(count_span);
    }

    ////////
    // Video events

    let videoEnding = false;

    let onVideoEnd = function() {
        videoEnding = false;
        incrementViewCount();
    }

    let onVideoSeeking = function(e) {
        let video = e.target;
        if (video.currentTime === 0 && videoEnding) {
            videoEnding = false;
            incrementViewCount();
        }
    }

    let onVideoTimeUpdate = function(e) {
        let video = e.target;
        if (video.currentTime >= video.duration - 1) {
            videoEnding = true;
        }
    }

    let video = document.querySelector("video");

    video.addEventListener("ended", onVideoEnd);
    video.addEventListener("seeking", onVideoSeeking);
    video.addEventListener("timeupdate", onVideoTimeUpdate);

    ////////
    // Page observer

    let info_strings = document.querySelector("#info-strings");
    if (info_strings) {
        init(info_strings);
    } else {
        let observer = new MutationObserver(function (mutations, mo) {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.classList && node.classList.contains("ytd-video-primary-info-renderer")) {
                        let info_strings = node.querySelector("#info-strings");
                        if (info_strings) {
                            init(info_strings);
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