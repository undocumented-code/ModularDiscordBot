const Discord = require("discord.js");
const io = require('socket.io')(8080);
const client = new Discord.Client();
const Datastore = require('nedb');
const db = new Datastore({filename: "allowances.db", "autoload":true});
let socketHash = {};
let lastChannel;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if(msg.isMentioned(client.user)) { //Are you talking to me?
    lastChannel = msg.channel;
    let socket;
    let words = msg.content.split(" ");
    words.shift(); //Split into words
    switch(words[0]) {
      case 'allow':
        db.update({ name: words[1] }, { name: words[1] }, { upsert: true }, function (err, numReplaced, upsert) {
          if(err) msg.react('💥');
          else {
            if (!upsert) msg.react('🤷');
            else msg.react("✔");
          }
        });
        break;
      case 'remove':
        db.remove({ name: words[1] }, function (err, numReplaced, upsert) {
          if(err) msg.react('💥');
          else msg.react("✔");
        });
        break;
      case 'assign':
        socket = socketHash[words[1]];
        if(socket) {
          socket.textchannel = msg.channel;
          msg.react("✔");
        } else {
          msg.react("❌");
        }
        break;
      default:
        socket = socketHash[words[0]];
        if (socket) socket.emit("message",words);
        break;
    }
  }
});

io.on('connection', function(socket){
  socket.textchannel = lastChannel;
  socket.on("declare",function(data) {
    const {name} = data;
    db.find({name}, function(err, docs) {
      if(docs.length==0) {
        socket.emit("not_allowed");
        socket.disconnect(true);
      } else {
        socketHash[name] = socket;
        socket.emit("ready");
      }
    });
    socket.on("message",function(content) {
      db.find({name}, function(err, docs) {
        if(docs.length==0) {
          socket.emit("not_allowed");
          socket.disconnect(true);
        } else {
          const channel = socket.textchannel;
          if(channel) channel.send(content);
          else lastChannel.send(content);
        }
      });
    });
  });
});

client.login('');