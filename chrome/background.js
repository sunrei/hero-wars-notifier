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
        console.log('settings loaded');
        update_settings(items.hwn_settings);
    }
});

chrome.storage.onChanged.addListener(function (changes) {
    if (changes.hwn_settings) {
        console.log('settings updated');
        update_settings(changes.hwn_settings.newValue);
    }
});

function notifyMe(options) {
    if (Notification.permission !== "granted") {
        console.log('Notification.permission !== "granted"');
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
    console.log('received message', message);

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
            var notification = {
                date: message.date,
                title: 'New message',
                body: '',
                icon: 'assets/images/logo_en.png'
            };
            messages.unshift(notification);
            notifyMe(notification);
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

function testMessage() {
    processMessage({
        type: 'newMail',
        date: 1499176684.966406,
        body: {
            letter: {
                type: "clanActivity",
                reward: {
                    consumable: {
                        '2': 15
                    }
                }
            }
        }
    });
    processMessage({"type":"newMail","id":"2437949803","body":{"pushUserId":1861923,"letter":{"read":0,"message":"","reward":{"coin":{"2":10}},"ctime":1499429427,"type":"grandDefence","id":208510740,"params":[],"senderId":-3,"availableUntil":0},"user":{"avatarId":30,"name":"Disposer","id":-3,"experience":84195,"level":80}},"date":1499429427.819608});
    processMessage({"type":"chatMessage","id":"2411196397","date":1499615421.871182,"body":{"data":{"ids":[],"text":"Пьяные рыбаки ночью поймали русалку. На утро оказалось, что это сом, и всем стало стыдно"},"userId":"1861923","ctime":1499615421,"chatType":"server","user":{"lastLoginTime":"1499615259","isChatModerator":false,"id":"1861923","accountId":"8878072","clanRole":"2","serverId":"17","avatarId":"25","name":"Dimka","clanId":"11276","level":"71"},"pushUserId":1861923,"id":4167246,"messageType":"text"}});
    processMessage({"type":"newMail","id":"3445294548","date":1499616214.252693,"body":{"user":{"experience":84195,"name":"Disposer","avatarId":30,"id":-3,"level":80},"letter":{"id":209842721,"message":"","read":0,"params":{"points":750,"clanTitle":"sir Tony","clanId":"11276","clanIcon":{"flagShape":14,"iconColor":19,"flagColor2":8,"iconShape":9,"flagColor1":7}},"type":"clanDungeonActivity","reward":{"coin":{"13":"1"}},"ctime":1499616214,"senderId":-3,"availableUntil":1499875414},"pushUserId":1861923}});
    processMessage({"type":"newMail","id":"2961436259","date":1499623613.259759,"body":{"user":{"avatarId":30,"experience":84195,"name":"Disposer","id":-3,"level":80},"pushUserId":1861923,"letter":{"availableUntil":1499882813,"message":"","read":0,"senderId":-3,"reward":{"consumable":{"3":"7"}},"type":"clanActivity","id":209875834,"ctime":1499623613,"params":{"points":29500,"clanTitle":"sir Tony","clanId":"11276","clanIcon":{"iconShape":9,"flagColor1":7,"flagShape":14,"iconColor":19,"flagColor2":8}}}}});
    processMessage({"type":"newMail","id":"2054185247","date":1499625209.753679,"body":{"user":{"avatarId":30,"experience":84195,"name":"Disposer","id":-3,"level":80},"pushUserId":1861923,"letter":{"availableUntil":0,"message":"","read":0,"senderId":-3,"reward":{"coin":{"1":10}},"type":"defence","id":209881681,"ctime":1499625209,"params":[]}}});
    processMessage({"type":"clanNewMember","id":"461768621","date":1499626386.803009,"body":{"user":{"avatarId":"41","id":"1723794","serverId":"17","isChatModerator":false,"accountId":"163882294","name":"Заг","clanId":"11276","lastLoginTime":"1499625687","clanRole":2,"level":"68"},"pushUserId":1861923}});
    processMessage({"type":"newMail","id":"1554283714","date":1499627837.302261,"body":{"user":{"experience":84195,"name":"Disposer","avatarId":30,"id":-3,"level":80},"letter":{"availableUntil":0,"message":"","senderId":-3,"params":{"channel":"group"},"type":"freebie","id":209893761,"reward":{"consumable":{"15":3}},"read":0,"ctime":1499627837},"pushUserId":1861923}});
}

// setTimeout(function(){
//     testMessage();
// }, 1000);

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
        console.log('disconnect existing module');
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
        console.log('message', message);
        processMessage(message);
    });
    module.on('disconnect', function() {
        chrome.browserAction.setIcon({path: icon_inactive});
    });
}
