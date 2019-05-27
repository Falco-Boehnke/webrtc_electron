"use strict";
exports.__esModule = true;
var NetworkConnectionManager_1 = require("./NetworkConnectionManager");
var UiElementHandler_1 = require("./UiElementHandler");
UiElementHandler_1.UiElementHandler.getAllUiElements();
var test = new NetworkConnectionManager_1.NetworkConnectionManager();
UiElementHandler_1.UiElementHandler.signaling_submit.addEventListener("click", establishConnectionToSignalingServer);
function establishConnectionToSignalingServer() {
    var signalingServerUrl = UiElementHandler_1.UiElementHandler.signaling_url.value;
    test.createWebsocketForSignaling(signalingServerUrl);
}
