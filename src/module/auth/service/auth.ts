import { Config, Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../../common/base.service';
import { AuthEntity } from '../entity/auth';
import { LoginDTO } from '../dto/login';
import { TokenVO } from '../vo/token';
import { UserEntity } from '../../user/entity/user';
import { R } from '../../../common/base.error.util';
import * as bcrypt from 'bcryptjs';
import { TokenConfig } from '../../../interface/token.config';
import { uuid } from '../../../utils/uuid';
import { RedisService } from '@midwayjs/redis';

@Provide()
export class AuthService extends BaseService<AuthEntity> {
  @InjectEntityModel(AuthEntity)
  authModel: Repository<AuthEntity>;

  @InjectEntityModel(UserEntity)
  userModel: Repository<UserEntity>;

  @Config('token')
  tokenConfig: TokenConfig;

  @Inject()
  redisService: RedisService;

  getModel(): Repository<AuthEntity> {
    return this.authModel;
  }

  async login(loginDTO: LoginDTO): Promise<TokenVO> {
    const { accountNumber } = loginDTO;
    const user = await this.userModel
      .createQueryBuilder('user')
      .where('user.phone = :accountNumber', { accountNumber })
      .orWhere('user.username = :accountNumber', { accountNumber })
      .orWhere('user.email = :accountNumber', { accountNumber })
      .select(['user.password', 'user.id'])
      .getOne();
    if (!user) throw R.error('账号不存在');
    if (!bcrypt.compareSync(loginDTO.password, user.password))
      throw R.error('密码错误');
    const { expire, refreshExpire } = this.tokenConfig;

    const token = uuid();
    const refreshToken = uuid();

    // multi可以实现redis指令并发执行
    await this.redisService
      .multi()
      .set(`token:${token}`, user.id)
      .expire(`token:${token}`, expire)
      .set(`refreshToken:${refreshToken}`, user.id)
      .expire(`refreshToken:${refreshToken}`, refreshExpire)
      .exec();

    return {
      expire,
      token,
      refreshExpire,
      refreshToken,
    };
  }
}
