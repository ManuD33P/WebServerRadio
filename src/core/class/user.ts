export class User{
    constructor(
        public name: string,
        public personalMessage: string,
        public avatar: string,
        public connected: boolean
    ) {
        this.name = name;
        this.connected = connected;
    }
}