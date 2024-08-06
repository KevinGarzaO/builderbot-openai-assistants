import { readFile } from 'fs/promises';

interface Config {
    account: string | undefined;
    token: string | undefined;
    endpoint: string | undefined;
}

interface ContactData {
    from: string;
    name: string;
    inbox: string;
}

interface ConversationData {
    inbox_id: string;
    contact_id: string;
    phone_number: string;
}

interface MessageData {
    msg: string;
    mode: 'incoming' | 'outgoing' | '';
    conversation_id: string;
    attachment: string[];
}

interface InboxData {
    name: string;
}

class ChatwootClass {
    config: Config = {
        account: undefined,
        token: undefined,
        endpoint: undefined
    }

    constructor(_config: Config = { account: undefined, token: undefined, endpoint: undefined }) {
        if (!_config?.account) {
            throw new Error('ACCOUNT_ERROR');
        }

        if (!_config?.token) {
            throw new Error(`TOKEN_ERROR`);
        }

        if (!_config?.endpoint) {
            throw new Error(`ENDPOINT_ERROR`);
        }

        this.config = _config;
    }

    formatNumber = (number: string): string => {
        if (!number.startsWith("+")) {
            return `+${number}`;
        }
        return number;
    }

    buildHeader = (): Headers => {
        const headers = new Headers();
        headers.append('api_access_token', this.config.token!);
        headers.append('Content-Type', 'application/json');
        return headers;
    }

    buildBaseUrl = (path: string): string => {
        return `${this.config.endpoint}/api/v1/accounts/${this.config.account}${path}`;
    }

    findContact = async (from: string): Promise<any[]> => {
        try {
            const url = this.buildBaseUrl(`/contacts/search?q=${from}`);
            const dataFetch = await fetch(url, {
                headers: this.buildHeader(),
                method: 'GET'
            });

            const data = await dataFetch.json();
            return data.payload[0];

        } catch (error) {
            console.error(`[Error searchByNumber]`, error);
            return [];
        }
    }

    createContact = async (dataIn: ContactData = { from: '', name: '', inbox: '' }): Promise<any> => {
        try {
            dataIn.from = this.formatNumber(dataIn.from);

            const data = {
                inbox_id: dataIn.inbox,
                name: dataIn.name,
                phone_number: dataIn.from,
            };

            const url = this.buildBaseUrl(`/contacts`);
            const dataFetch = await fetch(url, {
                headers: this.buildHeader(),
                method: 'POST',
                body: JSON.stringify(data)
            });

            const response = await dataFetch.json();
            return response.payload.contact;

        } catch (error) {
            console.error(`[Error createContact]`, error);
            return;
        }
    }

    findOrCreateContact = async (dataIn: ContactData = { from: '', name: '', inbox: '' }): Promise<any> => {
        try {
            dataIn.from = this.formatNumber(dataIn.from);
            const getContact = await this.findContact(dataIn.from);
            if (!getContact) {
                const contact = await this.createContact(dataIn);
                return contact;
            }
            return getContact;

        } catch (error) {
            console.error(`[Error findOrCreateContact]`, error);
            return;
        }
    }

    createConversation = async (dataIn: ConversationData = { inbox_id: '', contact_id: '', phone_number: '' }): Promise<any> => {
        try {
            dataIn.phone_number = this.formatNumber(dataIn.phone_number);

            const payload = {
                custom_attributes: { phone_number: dataIn.phone_number },
            };

            const url = this.buildBaseUrl(`/conversations`);
            const dataFetch = await fetch(url, {
                method: "POST",
                headers: this.buildHeader(),
                body: JSON.stringify({ ...dataIn, ...payload }),
            });
            const data = await dataFetch.json();
            return data;
        } catch (error) {
            console.error(`[Error createConversation]`, error);
            return;
        }
    }

    findConversation = async (dataIn: { phone_number: string } = { phone_number: '' }): Promise<any> => {
        try {
            dataIn.phone_number = this.formatNumber(dataIn.phone_number);

            const payload = [
                {
                    attribute_key: "phone_number",
                    attribute_model: "standard",
                    filter_operator: "equal_to",
                    values: [dataIn.phone_number],
                    custom_attribute_type: "",
                },
            ];

            const url = this.buildBaseUrl(`/conversations/filter`);
            const dataFetch = await fetch(url, {
                method: "POST",
                headers: this.buildHeader(),
                body: JSON.stringify({ payload }),
            });

            const data = await dataFetch.json();
            console.log("Data 176:")
            console.log(data)
            return data.payload;
        } catch (error) {
            console.error(`[Error findConversation]`, error);
            return;
        }
    }

    findOrCreateConversation = async (dataIn: ConversationData = { inbox_id: '', contact_id: '', phone_number: '' }): Promise<any> => {
        try {
            dataIn.phone_number = this.formatNumber(dataIn.phone_number);
            const getId = await this.findConversation(dataIn);
            console.log()
            if (!getId.length) {
                console.log('Crear conversation');
                const conversationId = await this.createConversation(dataIn);
                return conversationId;
            }
            return getId[0];
        } catch (error) {
            console.error(`[Error findOrCreateInbox]`, error);
            return;
        }
    }

    createMessage = async (dataIn: MessageData = { msg: '', mode: '', conversation_id: '', attachment: [] }): Promise<any> => {
        try {
            const url = this.buildBaseUrl(`/conversations/${dataIn.conversation_id}/messages`);
            const form = new FormData();

            form.set("content", dataIn.msg);
            form.set("message_type", dataIn.mode);
            form.set("private", "true");

            if (dataIn.attachment?.length) {
                const fileName = `${dataIn.attachment[0]}`.split('/').pop();
                const blob = new Blob([await readFile(dataIn.attachment[0])]);
                form.set("attachments[]", blob, fileName);
            }
            const dataFetch = await fetch(url, {
                method: "POST",
                headers: {
                    api_access_token: this.config.token!
                },
                body: form
            });
            const data = await dataFetch.json();
            return data;
        } catch (error) {
            console.error(`[Error createMessage]`, error);
            return;
        }
    }

    createInbox = async (dataIn: InboxData = { name: '' }): Promise<any> => {
        try {
            const payload = {
                name: dataIn.name,
                channel: {
                    type: "api",
                    webhook_url: "",
                },
            };

            const url = this.buildBaseUrl(`/inboxes`);
            const dataFetch = await fetch(url, {
                headers: this.buildHeader(),
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await dataFetch.json();
            return data;

        } catch (error) {
            console.error(`[Error createInbox]`, error);
            return;
        }
    }

    findInbox = async (dataIn: InboxData = { name: '' }): Promise<any> => {
        try {
            const url = this.buildBaseUrl(`/inboxes`);
            const dataFetch = await fetch(url, {
                headers: this.buildHeader(),
                method: 'GET',
            });

            const data = await dataFetch.json();
            console.log("Data:")
            console.log(data)
            const payload = data.payload;
           
            const checkIfExist = payload.find((o: any) => o.name === dataIn.name);

            if (!checkIfExist) {
                return;
            }

            return checkIfExist;
        } catch (error) {
            console.error(`[Error findInbox]`, error);
            return;
        }
    }

    findOrCreateInbox = async (dataIn: InboxData = { name: '' }): Promise<any> => {
        try {
            const getInbox = await this.findInbox(dataIn);
            console.log(getInbox)
            if (!getInbox) {
                const idInbox = await this.createInbox(dataIn);
                return idInbox;
            }
            return getInbox;

        } catch (error) {
            console.error(`[Error findOrCreateInbox]`, error);
            return;
        }
    }
}

export default ChatwootClass;


