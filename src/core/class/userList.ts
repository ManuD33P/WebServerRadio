import { User } from "./user";

export class UserList {
    private static instance: UserList;
    private users: Map<string, User> = new Map();

    // Constructor privado para prevenir la creación de instancias con 'new'
    private constructor() {}

    /**
     * Obtiene la instancia única de UserList
     * @returns La instancia única de UserList
     */
    public static getInstance(): UserList {
        if (!UserList.instance) {
            UserList.instance = new UserList();
        }
        return UserList.instance;
    }

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