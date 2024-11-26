import {Injectable, UnauthorizedException} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import {InjectRepository} from "@nestjs/typeorm";
import {UserRepository} from "./repositories/user.repository";
import {ExtractJwt, Strategy} from "passport-jwt"; // passport 가 아닌 passport-jwt에서 가져와야함 jwt전략을 사용하기 때문에
import {User} from "./entities/user.entity";

// 우리는 모든 유효한 요청에는 유저 정보가 들어 있기를 원함.
// 이것을 이용해서 이 유저가 어드민 유저인지 또는 어떠한 게시물을 지울수 있는 사람인지 판단하기 위해서 요청 안에서 유저정보를 넣는 것.,


// JwtStrategy를 다른 곳에서도 주입해서 사용할수 있도록 하기 위한 데코레이터
@Injectable()
// PassportStrategy 안에 기능을 사용하기 위한 상속 Strategy는 JWTStrategy를 사용하기 위해서 넣어준다.
export class JwtStrategy extends PassportStrategy(Strategy){
  constructor(
    // 나중에 토큰이 유효한지 확인을 한 다음에 payload에 username을 기반으로 user객체를 데이터베이스에서 가져오기 위해 UserRepository 주입
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {
    super({
      secretOrKey:'Secret1234',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload) : Promise<User> {
    const {name} = payload;
    //payload에 있는 유저이름이 데이터베이스에서 있는 유저인지 확인
    console.log("Payload received:", payload);
    const user =  await this.userRepository.findOne({ where: { name } });

    if (!user) {
      // 존재하지 않을 시 에러를 던져줌.
      throw new UnauthorizedException(`Can't find user with username ${name}`);
    }

    return user;
  }

}