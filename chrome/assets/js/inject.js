(function($) {
    var scripts = document.getElementsByTagName('script');
    for (var j = 0; j < scripts.length; j++) {
        if (scripts[j].innerText.indexOf('new progrestar.Pushd4Client') !== -1) {
            var matches = scripts[j].innerText.match(/\"(\d{10}\:.+\:.+)\"/);
            if (matches && matches[1]) {
                var params = {
                    authToken: matches[1].replace(/\\\//g, '/')
                };
                var query = window.location.search.substring(1);
                var vars = query.split('&');
                for (var i = 0; i < vars.length; i++) {
                    var pair = vars[i].split('=');
                    var key = decodeURIComponent(pair[0]);
                    var value = decodeURIComponent(pair[1]);
                    if (['api_id', 'user_id', 'viewer_id'].indexOf(key) !== -1) {
                        params[key] = value;
                    }
                }
                chrome.runtime.sendMessage({"hwnInitClient": params});
            }
            break;
        }
    }
})();
