'use strict';

var region = 'eu-west-1';
var poolId = 'eu-west-1:82de430e-6f53-4d84-90fa-509d6b6775d3';

function checkFacebookStatus() {
    FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
            FB.login(function(){}, {scope: 'publish_actions'});
            var accessToken = response.authResponse.accessToken;
            var appToken = '860675960666169|00_5tkwxjsUj_u6P1-U1IXjj9mE';
            FB.api('/me', 'GET', { 'fields':'id,name' }, function(response) {
                var name = response.name;
                var id = response.id;
                console.log('name: ' + name + ', appToken: ' + appToken);
                var div = document.getElementById('login-name');
                div.innerHTML = 'Namn: ' + name;
                // Get events from dynamodb.
                amazonas(accessToken, name, id, appToken);
            });
        } else if (response.status === 'not_authorized') {
            console.log('User has not authorized the app');
        } else {
            var div = document.getElementById('login-name');
            div.innerHTML = 'Not logged in';
            var adiv = document.getElementById('images');
            adiv.innerHTML = '';
            var rdiv = document.getElementById('reg_status');
            rdiv.innerHTML = '';
            console.log('Not logged in to FB');
        }
    });
}

function amazonas(accessToken, name, id, appToken) {
    AWS.config.update({
        region: region,
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: poolId,
            Logins: {
                'graph.facebook.com': accessToken
            },
            expired: true
        })
    });

    var docClient = new AWS.DynamoDB.DocumentClient({region: region});

    var params = {
        TableName: 'Image-Table',
        KeyConditionExpression: 'username = :username',
//        Limit: 2,
        ScanIndexForward: false,    // true = ascending, false = descending
        FilterExpression: 'active = :bool',
        ExpressionAttributeValues: {
            ':username': 'kometen',
            ':bool': true
        }
    };

    docClient.query(params, function(err, data) {
        if (err) {
            console.log(JSON.stringify(err, null, 2));
        } else {
            console.log(JSON.stringify(data, null, 2));

            var adiv = document.getElementById('images');
            adiv.innerHTML = "";

            var array_length = data.Items.length;

            for (var i = 0; i < array_length; ++i) {
                var obj = data.Items[i];
                console.log('item nr. ' + i + ', ' + obj.username + ', ' + obj.filename);

                adiv.innerHTML = adiv.innerHTML + "<div class='row'><div class='center-div six columns'>" + obj.username + ", " + obj.filename + "</div></div>";
                adiv.innerHTML = adiv.innerHTML + "<div class='row'><div class='center-div six columns'><button id='button_id_" + i + "' class='button-primary'>Click</button></div></div>";
            }
        }
    });
}
