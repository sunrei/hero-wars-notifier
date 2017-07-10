var messages = [];
var hwn_settings = {
    'showClanChat': true,
    'showServerChat': false,
    'showMail': true,
    'showClanActivity': true,
    'showArenaDefence': true,
    'showGrandDefence': true,
    'showArenaPlaceChanged': true,
    'showGrandPlaceChanged': true,
    'showClanNewMember': false
};
var icon_inactive = "assets/icons/icon-48-i.png";
var icon_active = "assets/icons/icon-48-a.png";

chrome.browserAction.setIcon({path: icon_inactive});

var module;

function update_settings(settings) {
    Object.keys(hwn_settings).forEach(function(key) {
        if (typeof settings[key] != 'undefined') {
            hwn_settings[key] = settings[key];
        }
    });
};

chrome.storage.local.get('hwn_settings', function (items) {
    if (!chrome.runtime.error && typeof items.hwn_settings != 'undefined') {
        update_settings(items.hwn_settings);
    }
});

chrome.storage.onChanged.addListener(function (changes) {
    if (changes.hwn_settings) {
        update_settings(changes.hwn_settings.newValue);
    }
});

function notifyMe(options) {
    if (Notification.permission !== "granted") {

    } else {
        if (!options.icon) {
            options.icon = 'assets/images/logo_en.png';
        }
        var notification = new Notification((options.title), {
            icon: chrome.extension.getURL(options.icon),
            body: (options.body),
            tag: options.tag
        });
        notification.onclick = function (event) {
            notification.close();
        };
    }
}

function processMessage(message) {

    var icons = {
        'ArenaDefence':      'assets/images/arenaDefence.png',
        'GrandDefence':      'assets/images/grandDefence.png',
        'ClanChat':          'assets/images/chatMessage.png',
        'ServerChat':        'assets/images/chatMessage.png',
        'GrandPlaceChanged': 'assets/images/defeat.png',
        'ArenaPlaceChanged': 'assets/images/defeat.png',
        'Energy':            'assets/images/energy.png',
        'Mail':              'assets/images/mail.png',
        'ClanActivity2':     'assets/images/runeGreen.png',
        'ClanActivity3':     'assets/images/runeBlue.png',
        'ClanActivity4':     'assets/images/runePurple.png',
        'DungeonActivity':   'assets/images/dungeonActivity.png',
        'ClanNewMember':     'assets/images/clanNewMember.png'
    };

    var type = '';
    var title = '';
    var body = '';

    switch (message.type) {
        case 'chatMessage':
            type = (message.body.chatType == 'clan') ? 'ClanChat' : 'ServerChat';
            title = message.body.user.name;
            body = message.body.data.text;
            break;
        case 'newMail':
            switch (message.body.letter.type) {
                case 'clanActivity':
                    if (message.body.letter.reward.consumable['2']) {
                        type = 'ClanActivity2';
                    } else if (message.body.letter.reward.consumable['3']) {
                        type = 'ClanActivity3';
                    }  else if (message.body.letter.reward.consumable['4']) {
                        type = 'ClanActivity4';
                    }
                    title = 'Награда за активность в Гильдии';
                    break;
                case 'clanDungeonActivity':
                    type = 'DungeonActivity';
                    title = 'Награда за бои в Подземелье Гильдии';
                    break;
                case 'defence':
                    type = 'ArenaDefence';
                    title = 'Успешная защита на арене';
                    break;
                case 'grandDefence':
                    type = 'GrandDefence';
                    title = 'Успешная защита на гранд арене';
                    break;
                default:
                    type = 'Mail';
                    title = 'Новое письмо на почте';
                    break;
            }
            break;
        case 'arenaPlaceChanged':
            if (message.body.type == 'grand') {
                type = 'GrandPlaceChanged';
                title = 'Поражение на гранд арене';
            } else {
                type = 'ArenaPlaceChanged';
                title = 'Поражение на арене';
            }
            body = 'Новое место: ' + message.body.place;
            break;
        case 'clanNewMember':
            type = 'ClanNewMember';
            title = 'Новый участник гильдии';
            body = message.body.user.name + ' (id: ' + message.body.user.id + ')';
            break;
        case 'clanDismissMember':
            return;
            break;
        default:
            return;
    }

    var notification = {
        date: message.date,
        type: type,
        title: title,
        body: body,
        icon: icons[type]
    };

    if (type != 'ServerChat' || hwn_settings['showServerChat']) {
        messages.unshift(notification);
    }

    if (['ClanActivity2', 'ClanActivity3', 'ClanActivity4', 'DungeonActivity'].indexOf(type) !== -1) {
        type = 'ClanActivity';
    }

    if (hwn_settings['show' + type]) {
        if (type == 'ServerChat' || type == 'ClanChat') {
            notification.tag = 'hwnChatMessage';
        }
        notifyMe(notification);
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.hwnInitClient) {
        init(request.hwnInitClient);
    } else if (request.hwnRequest) {
        switch (request.hwnRequest) {
            case 'getMessages':
                sendResponse(messages);
                break;
            case 'getStatus':
                sendResponse(!!module && module._isConnected());
                break;
            case 'disconnect':
                disconnect();
                break;
        }
    }
});

function disconnect() {
    if (module) {
        module.disconnect();
    }
}

function init(params) {
    disconnect();
    module = new progrestar.Pushd4Client(
        ['wss://pushd.nextersglobal.com:443/websocket'],
        'vk',
        params.api_id,
        params.viewer_id,
        params.authToken,
        {debug: false}
    );

    module.on('connect', function() {
        chrome.browserAction.setIcon({path: icon_active});
    });
    module.connect();
    module.on('message', function(message){
        processMessage(message);
    });
    module.on('disconnect', function() {
        chrome.browserAction.setIcon({path: icon_inactive});
    });
}
