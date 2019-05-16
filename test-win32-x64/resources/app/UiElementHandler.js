export class UiElementHandler {
    static getAllUiElements() {
        UiElementHandler.signaling_url = document.getElementById('signaling_uri');
        UiElementHandler.signaling_submit = document.getElementById('submit_button');
        UiElementHandler.login_nameInput = document.getElementById('login_name');
        UiElementHandler.login_button = document.getElementById('login_button');
        UiElementHandler.msgInput = document.getElementById('msgInput');
        UiElementHandler.chatbox = document.getElementById('chatbox');
        UiElementHandler.sendMsgButton = document.getElementById('sendMessage');
        UiElementHandler.connectToUserButton = document.getElementById('userConnect');
        UiElementHandler.usernameToConnectTo = document.getElementById('connectToUsername');
        UiElementHandler.disconnectButton = document.getElementById('disconnectBtn');
    }
}
//# sourceMappingURL=UiElementHandler.js.map