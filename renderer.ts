import { UiElementHandler } from "./DataObjects/UiElementHandler";
import { NetworkConnectionManager } from "./NetworkConnectionManager";

UiElementHandler.getAllUiElements();
const test = new NetworkConnectionManager();

UiElementHandler.signaling_submit.addEventListener("click", establishConnectionToSignalingServer);

function establishConnectionToSignalingServer()
{
    let signalingServerUrl = UiElementHandler.signaling_url.value;
    test.createWebsocketForSignaling(signalingServerUrl);
}