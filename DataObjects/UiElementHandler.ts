export abstract class UiElementHandler {
    public static signaling_submit: HTMLElement;
    public static signaling_url: HTMLInputElement;
    public static login_nameInput;
    public static login_button;
    public static msgInput: HTMLInputElement;
    public static chatbox: HTMLInputElement;
    public static sendMsgButton;
    public static connectToUserButton;
    public static usernameToConnectTo: HTMLInputElement;
    public static disconnectButton;

    public static getAllUiElements() {
            UiElementHandler.signaling_url = document.getElementById("signaling_uri") as HTMLInputElement;
            UiElementHandler.signaling_submit = document.getElementById("submit_button");
            UiElementHandler.login_nameInput = document.getElementById("login_name");
            UiElementHandler.login_button = document.getElementById("login_button");
            UiElementHandler.msgInput = document.getElementById("msgInput") as HTMLInputElement;
            UiElementHandler.chatbox = document.getElementById("chatbox") as HTMLInputElement;
            UiElementHandler.sendMsgButton = document.getElementById("sendMessage");
            UiElementHandler.connectToUserButton = document.getElementById("userConnect");
            UiElementHandler.usernameToConnectTo = document.getElementById("connectToUsername") as HTMLInputElement;
            UiElementHandler.disconnectButton = document.getElementById("disconnectBtn");
    }

}
