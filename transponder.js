const io = require("socket.io-client");
const socket = io.connect("http://localhost:8080");

socket.on("connect",function() {
    socket.emit("declare",{name: "lemons"});
});

socket.on("ready",function() {
    console.log("I was accepted!");
});

socket.on("not_allowed", function() {
    console.log("I was not allowed");
});

socket.on("message", function(words) {
    console.log(words);
    socket.emit("message", "lemons are great!");
});