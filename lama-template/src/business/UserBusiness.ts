import { UserInputDTO, LoginInputDTO, User} from "../model/User";
import userDatabase, { UserDatabase } from "../data/UserDatabase";
import idGenerator, { IdGenerator }  from "../services/IdGenerator";
import hashManager , { HashManager } from "../services/HashManager";
import authenticator , { Authenticator } from "../services/Authenticator";
import { BaseError } from "../error/BaseError";


export class UserBusiness {

    constructor(
        private idGenerator: IdGenerator,
        private hashManager: HashManager,
        private userDatabase: UserDatabase,
        private authenticator: Authenticator
     ) {}

     
    public async createUser(user: UserInputDTO) {

        if (!user.name || !user.email || !user.password || !user.role) {
            throw new BaseError(422, "Missing input");
         }
         
         if (user.email.indexOf("@") === -1) {
            throw new BaseError(422, "Invalid email");
         }

         if (user.password.length < 6) {
            throw new BaseError(422, "Invalid password");
         }

        const id = this.idGenerator.generate();

        const hashPassword = await this.hashManager.hash(user.password);

        await this.userDatabase.createUser(new User(id, user.email, user.name, hashPassword, User.stringToUserRole(user.role)));

        const accessToken = this.authenticator.generateToken({ id, role: user.role });

        return accessToken;
    }

    async getUserByEmail(user: LoginInputDTO) {

        const userDatabase = new UserDatabase();
        const userFromDB = await userDatabase.getUserByEmail(user.email);

        const hashManager = new HashManager();
        const hashCompare = await hashManager.compare(user.password, userFromDB.getPassword());

        const authenticator = new Authenticator();
        const accessToken = authenticator.generateToken({ id: userFromDB.getId(), role: userFromDB.getRole() });

        if (!hashCompare) {
            throw new Error("Invalid Password!");
        }

        return accessToken;
    }
}

export default new UserBusiness(
    idGenerator,
    hashManager,
    userDatabase,
    authenticator
 )
 