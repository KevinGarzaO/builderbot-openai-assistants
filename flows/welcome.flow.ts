import { addKeyword, EVENTS } from "@builderbot/bot";
import { JsonFileDB  as Database } from "@builderbot/database-json";
import { TwilioProvider as Provider } from "@builderbot/provider-twilio";
import conversationalLayer from "layers/conversational.layer";
import main from "layers/main";
  
  
  export const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
  .addAction(conversationalLayer)
  .addAction(main)
    
 
