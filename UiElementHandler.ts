export abstract class UiElementHandler
{
    static signaling_submit;
    static signaling_url: HTMLInputElement;
    static login_nameInput;
    static login_button;
    static msgInput: HTMLInputElement;
    static chatbox: HTMLInputElement;
    static sendMsgButton;
    static connectToUserButton;
    static usernameToConnectTo: HTMLInputElement;
    static disconnectButton;

    static getAllUiElements() {
            UiElementHandler.signaling_url = <HTMLInputElement>document.getElementById('signaling_uri');
            UiElementHandler.signaling_submit = document.getElementById('submit_button');
            UiElementHandler.login_nameInput = document.getElementById('login_name');
            UiElementHandler.login_button = document.getElementById('login_button');
            UiElementHandler.msgInput = <HTMLInputElement>document.getElementById('msgInput');
            UiElementHandler.chatbox = <HTMLInputElement>document.getElementById('chatbox');
            UiElementHandler.sendMsgButton = document.getElementById('sendMessage');
            UiElementHandler.connectToUserButton = document.getElementById('userConnect');
            UiElementHandler.usernameToConnectTo = <HTMLInputElement>document.getElementById('connectToUsername');
            UiElementHandler.disconnectButton = document.getElementById('disconnectBtn');
    }


    
}