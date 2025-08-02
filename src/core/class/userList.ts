import { User } from "./user";

class UserList{
    constructor(
        public users: Map<string, User> = new Map()
    ) {}

    addUser(user: User): void{
        this.users.set(user.name,user);
    }

    removeUser(user: User): boolean{
        return this.users.delete(user.name);
    }

    getUsers(): User[]{
        return Array.from(this.users.values());
    }

    isExist(name: string): boolean{
        return this.users.has(name);
    }

    getUser(name: string): User | undefined{
        return this.users.get(name);
    }

    getCount(): number{
        return this.users.size;
    }
}