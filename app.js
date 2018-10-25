var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
console.log('%s listening to %s', server.name, server.url);
});
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
appId: "",//process.env.MICROSOFT_APP_ID,
appPassword: ""//process.env.MICROSOFT_APP_PASSWORD
});
// Listen for messages from users
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//setting up luis
const LuisModelUrl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/26e50d88-be36-4baf-806a-dde2e1fc6896?subscription-key=7aeea59a16a5467aacff93989cd145f5&verbose=true&timezoneOffset=0&q=";
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intents);

//setting up conversation

intents.matches('GetWeather', function (session, args) {
    // Dealing with entities passed from luis
    var City = builder.EntityRecognizer.findEntity(args.entities, 'City');
    if (City) {
        City = City.entity;
        request("http://api.openweathermap.org/data/2.5/forecast?q="+City+"&APPID=db9474c5badd7455cf17b94ba05bbc76" , function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                var info = body.list[0].main;

                //Finding average temperature
                var sum=0;
                var n=0;
                for (var i = 0; i < (body.list).length; ++i)
                {
                    if (body.list[i].main.temp)
                    {
                       sum=sum+Math.floor(body.list[i].main.temp);
                       n+=1;
                    }
                }
                //City name to be presented in bot's response
                City=body.city.name;

                sum=sum/n;
                sum=sum-273.15;
                sum=parseFloat(Math.round(sum * 100) / 100).toFixed(2);
                if (sum) {
                    session.endDialog(City + "'s today's average temperature is " + sum.toString() + "\u00B0" + "C  :)");
                } else {
                    session.endDialog("Sorry, an error occurred. Please try again!! :(");
                }
            } else {
                session.endDialog("Sorry, an error occurred. Please try again! :(");
            }
        });
    } else {
        session.endDialog("Sorry, I don't think there is any city by that name. :(");
    }
})

.matches('None', function (session) {
    session.endDialog("I am sorry I don't understand. You are trying to access something I am not capable of doing so. I can only find \"temperatures\" of cities. Sorry once again!");
});

