(function(){
    function toggle(id, type){
        type = type || 'block';
        var state = document.getElementById(id).style.display;
        document.getElementById(id).style.display = (state == 'none' ? type : 'none');
    }
    function leftpad (value, length, pad_char) {
        while (value.length < length) {
            value = pad_char + value;
        }
        return value;
    }
    function getTime(date) {
        return date.getHours() + ':' + leftpad(date.getMinutes().toString(), 2, '0');
    }
    function getDateTime(date) {
        var month_names = [
            'января',
            'февраля',
            'марта',
            'апреля',
            'мая',
            'июня',
            'июля',
            'августа',
            'сентября',
            'октября',
            'ноября',
            'декабря'
        ];
        return date.getDate() + ' ' + month_names[date.getMonth()]  + ' ' + getTime(date);
    }

    var hwn_settings = {
        'showClanChat': true,
        'showServerChat': false,
        'showMail': true,
        'showClanActivity': true,
        'showArenaDefence': true,
        'showGrandDefence': true,
        'showArenaPlaceChanged': true,
        'showGrandPlaceChanged': true,
        'showClanNewMember': false,
        'showClanDismissMember': false,
        'showChallenge': false,
        'showReplay': false
    };

    function save_settings() {
        Object.keys(hwn_settings).forEach(function(key){
            hwn_settings[key] = document.getElementsByName(key)[0].checked;
            document.getElementsByName(key)[0].parentElement.className = hwn_settings[key] ? 'active' : '';
        });
        chrome.storage.local.set({hwn_settings: hwn_settings}, function() {});
    }

    function init_settings(settings) {

        Object.keys(hwn_settings).forEach(function(key) {
            if (typeof settings[key] != 'undefined') {
                hwn_settings[key] = settings[key];
            }
            if (hwn_settings[key]) {
                document.getElementsByName(key)[0].parentElement.className = 'active';
            }
            document.getElementsByName(key)[0].checked = hwn_settings[key];
            document.getElementsByName(key)[0].onchange = save_settings;
        });
    }

    function toggleSettings() {
        toggle('settings');
        toggle('messages');
        toggle('messages-title');
        toggle('settings-title');
    }

    window.onload = function () {
        chrome.storage.local.get('hwn_settings', function (items) {
            if (!chrome.runtime.error && typeof items.hwn_settings != 'undefined') {
                init_settings(items.hwn_settings);
            } else {
                init_settings({});
            }
        });

        chrome.runtime.sendMessage({"hwnRequest": "getMessages"}, function(response) {
            if (response && response.length) {
                toggle('empty');
                var container = document.getElementById('messages');
                response.forEach(function(message) {
                    var message_div = document.createElement('div');
                    message_div.className = 'message ' + message.type;

                    var icon_container = document.createElement('div');
                    icon_container.className = 'icon-container';

                    var icon = document.createElement('img');
                    icon.src = message.icon;

                    icon_container.appendChild(icon);

                    message_div.appendChild(icon_container);

                    var info_container = document.createElement('div');
                    info_container.className = 'info-container';

                    var time;
                    //time = document.createElement('div');
                    // time.className = 'info-time';
                    // time.innerText = (new Date(message.date * 1000)).toTimeString();
                    // info_container.appendChild(time);

                    time = document.createElement('div');
                    time.className = 'info-time';
                    var date = new Date(message.date * 1000);
                    var time_diff = Math.floor(((new Date()) - date) / 1000);
                    if (time_diff < 60) {
                        var seconds = time_diff;
                        var seconds_text = 'секунд';
                        if ([11, 12, 13, 14].indexOf(seconds) !== -1) {

                        } else if (seconds % 10 == 1) {
                            seconds_text += 'у';
                        } else if ([2,3,4].indexOf(seconds % 10) !== -1) {
                            seconds_text += 'ы';
                        }
                        time.innerText = seconds + ' ' + seconds_text + ' назад';
                        time.innerText = time_diff + ' секунд назад';
                    } else if (time_diff < 60 * 60) {
                        var minutes = Math.floor(time_diff / 60);
                        var minutes_text = 'минут';
                        if ([11, 12, 13, 14].indexOf(minutes) !== -1) {

                        } else if (minutes % 10 == 1) {
                            minutes_text += 'у';
                        } else if ([2,3,4].indexOf(minutes % 10) !== -1) {
                            minutes_text += 'ы';
                        }
                        time.innerText = minutes + ' ' + minutes_text + ' назад';
                        time.setAttribute('title', getTime(date));
                    } else if (time_diff < 60 * 60 * 4) {
                        var hours = Math.floor(time_diff / 3600);
                        time.innerText = hours + ' час' + (hours > 1 ? 'a' : '') + ' назад';
                        time.setAttribute('title', getTime(date));
                    } else if (time_diff < 60 * 60 * 12) {
                        time.innerText = getTime(date);
                        time.setAttribute('title', getDateTime(date));
                    } else {
                        time.innerText = getDateTime(date);
                    }

                    time.style.textAlign = 'right';
                    info_container.appendChild(time);

                    var title = document.createElement('div');
                    title.className = 'info-title';
                    title.innerText = message.title;
                    info_container.appendChild(title);

                    var body = document.createElement('div');
                    body.className = 'info-body';
                    body.innerText = message.body;
                    info_container.appendChild(body);

                    message_div.appendChild(info_container);

                    //message_div.innerHTML = JSON.stringify(message);
                    container.appendChild(message_div);
                });
            } else {
                toggleSettings();
                //toggle('settings-toggle');
            }
        });

        document.getElementById('settings-toggle').onclick = toggleSettings;

        chrome.runtime.sendMessage({"hwnRequest": "getStatus"}, function(status) {
            if (status) {
                toggle('disconnect', 'inline');
                document.getElementById('disconnect').onclick = function () {
                    chrome.runtime.sendMessage({"hwnRequest": "disconnect"});
                    toggle('disconnect');
                };
            }
        });
    };
})();
