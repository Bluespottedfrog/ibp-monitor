import moment from 'moment'
import { DataTypes, Op, Sequelize, Model } from 'sequelize'

import { chainModel } from '../data/models/chain.js'
import { memberModel } from '../data/models/member.js'
import { membershipLevelModel } from '../data/models/membership-level.js'
import { serviceModel } from '../data/models/service.js'
import { memberServiceModel } from '../data/models/member-service.js'
import { memberServiceNodeModel } from '../data/models/member-service-node.js'
import { monitorModel } from '../data/models/monitor.js'
import { healthCheckModel } from '../data/models/health-check.js'
import { logModel } from '../data/models/log.js'
import { geoDnsPoolModel } from '../data/models/geo-dns-pool.js'

// import { Umzug, SequelizeStorage } from 'umzug'

import { config } from '../config/config.js'
import { config as configLocal } from '../config/config.local.js'
const cfg = Object.assign(config, configLocal)

const sequelize = new Sequelize(
  cfg.sequelize.database,
  cfg.sequelize.username,
  cfg.sequelize.password,
  cfg.sequelize.options
)

class DataStore {
  Chain = undefined
  GeoDnsPool = undefined
  HealthCheck = undefined
  Log = undefined
  Member = undefined
  MembershipLevel = undefined
  MemberService = undefined
  MemberServiceNode = undefined
  Service = undefined
  Monitor = undefined

  pruning = {
    age: 90 * (24 * 60 * 60), // days as seconds
    interval: 1 * (24 * 60 * 60), // 1 day as seconds
  }

  constructor(config = {}) {
    console.debug('DataStore()', config)

    this.pruning = Object.assign(this.pruning, config.pruning)
    // define chain
    const Chain = sequelize.define(chainModel.options.tableName, chainModel.definition, {
      ...chainModel.options,
      sequelize,
    })
    Chain.hasMany(Chain, {
      foreignKey: 'relayChainId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    Chain.belongsTo(Chain, {
      foreignKey: 'relayChainId',
    })

    // define membership level
    const MembershipLevel = sequelize.define(
      membershipLevelModel.options.tableName,
      membershipLevelModel.definition,
      {
        ...membershipLevelModel.options,
        sequelize,
      }
    )

    // define member
    const Member = sequelize.define('member', memberModel.definition, {
      ...memberModel.options,
      sequelize,
    })
    MembershipLevel.hasMany(Member, {
      as: 'members',
      foreignKey: 'membershipLevelId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    Member.belongsTo(MembershipLevel, {
      as: 'membershipLevel',
      foreignKey: 'membershipLevelId',
    })

    // define service
    const Service = sequelize.define('service', serviceModel.definition, {
      ...serviceModel.options,
      sequelize,
    })
    Chain.hasMany(Service, {
      as: 'services',
      foreignKey: 'chainId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    Service.belongsTo(Chain, {
      as: 'chain',
      foreignKey: 'chainId',
    })
    MembershipLevel.hasMany(Service, {
      as: 'services',
      foreignKey: 'membershipLevelId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    Service.belongsTo(MembershipLevel, {
      as: 'membershipLevel',
      foreignKey: 'membershipLevelId',
    })

    // define member service
    const MemberService = sequelize.define('member_service', memberServiceModel.definition, {
      ...memberServiceModel.options,
      sequelize,
    })
    Member.hasMany(MemberService, {
      as: 'services',
      foreignKey: 'memberId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    MemberService.belongsTo(Member, {
      as: 'member',
      foreignKey: 'memberId',
    })

    // define member service node
    const MemberServiceNode = sequelize.define(
      'member_service_node',
      memberServiceNodeModel.definition,
      {
        ...memberServiceNodeModel.options,
        sequelize,
      }
    )
    Service.hasMany(MemberServiceNode, {
      as: 'nodes',
      foreignKey: 'serviceId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    MemberServiceNode.belongsTo(Service, {
      as: 'service',
      foreignKey: 'serviceId',
    })
    Member.hasMany(MemberServiceNode, {
      as: 'nodes',
      foreignKey: 'memberId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    MemberServiceNode.belongsTo(Member, {
      as: 'member',
      foreignKey: 'memberId',
    })
    MemberService.hasMany(MemberServiceNode, {
      as: 'nodes',
      foreignKey: 'memberServiceId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    MemberServiceNode.belongsTo(MemberService, {
      as: 'memberService',
      foreignKey: 'memberServiceId',
    })

    // define monitor
    const Monitor = sequelize.define('member_service_node', monitorModel.definition, {
      ...monitorModel.options,
      sequelize,
    })

    // define health check
    const HealthCheck = sequelize.define('health_check', healthCheckModel.definition, {
      ...healthCheckModel.options,
      sequelize,
    })
    Monitor.hasMany(HealthCheck, {
      as: 'healthChecks',
      foreignKey: 'monitorId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    HealthCheck.belongsTo(Monitor, {
      as: 'monitor',
      foreignKey: 'monitorId',
    })
    Service.hasMany(HealthCheck, {
      as: 'healthChecks',
      foreignKey: 'serviceId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    HealthCheck.belongsTo(Service, {
      as: 'service',
      foreignKey: 'serviceId',
    })
    Member.hasMany(HealthCheck, {
      as: 'healthChecks',
      foreignKey: 'memberId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    HealthCheck.belongsTo(Member, {
      as: 'member',
      foreignKey: 'memberId',
    })
    MemberServiceNode.hasMany(HealthCheck, {
      as: 'healthChecks',
      foreignKey: 'peerId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    HealthCheck.belongsTo(MemberServiceNode, {
      as: 'node',
      foreignKey: 'peerId',
    })

    // define log
    const Log = sequelize.define('log', logModel.definition, { ...logModel.options, sequelize })
    MemberServiceNode.hasMany(Log, {
      as: 'logs',
      foreignKey: 'peerId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    Log.belongsTo(MemberServiceNode, {
      as: 'node',
      foreignKey: 'peerId',
    })
    MemberService.hasMany(Log, {
      as: 'logs',
      foreignKey: 'memberServiceId',
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    })
    Log.belongsTo(MemberService, {
      as: 'memberService',
      foreignKey: 'memberServiceId',
    })

    const GeoDnsPool = sequelize.define('geo_dns_pool', geoDnsPoolModel.definition, {
      ...geoDnsPoolModel.options,
      sequelize,
    })

    this.Chain = Chain
    this.GeoDnsPool = GeoDnsPool
    this.HealthCheck = HealthCheck
    this.Log = Log
    this.Member = Member
    this.MembershipLevel = MembershipLevel
    this.MemberService = MemberService
    this.MemberServiceNode = MemberServiceNode
    this.Monitor = Monitor
    this.Service = Service
  }

  /*
  async migrate() {
    const umzug = new Umzug({
      migrations: { glob: './data/migrations/*.js' },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    })
    await umzug.up()
  }
  */

  async close() {
    console.debug('Closing datastore...')
    return await sequelize.close()
  }

  async log(level = 'info', data) {
    const model = {
      level,
      data,
    }
    return this.Log.create(model)
  }

  async prune() {
    console.debug('DataStore.prune()', this.pruning)
    const marker = moment.utc().add(-this.pruning.age, 'seconds')
    console.debug('marker', marker)
    var result
    result = await this.HealthCheck.destroy({
      where: { createdAt: { [Op.lt]: marker.format('YYYY-MM-DD HH:mm:ss') } },
    })
    console.debug('HealthCheck.prune: delete', result)
    // result = await this.Service.update({ status: 'stale' }, { where: { status: {[Op.ne]: 'stale' }, errorCount: { [Op.gt]: 10 } } })
    // console.debug('Service.stale: error', result)
    // result = await this.Service.update({ status: 'stale' }, { where: { status: {[Op.ne]: 'stale' }, updatedAt: { [Op.lt]: marker } } })
    // console.debug('Service.stale: updatedAt', result)
    // delete healthChecks for stale services
    // const staleServices = this.Service.findAll({ where: { status: 'stale', updatedAt: { [Op.lt]: marker } } })
    // for(var i = 0; i < staleServices.length; i++) {
    //   const svc = staleServices[i]
    //   await this.HealthCheck.destroy({ where: { serviceUrl: svc.serviceUrl } })
    // }
    // result = await this.HealthCheck.destroy({ where: })
    // delete stale services
    // result = await this.Service.destroy({ where: { status: 'stale', updatedAt: { [Op.lt]: marker } } })
    // console.debug('Services.prune: stale', result)
    // TODO prune stale monitors
  }
}

export { DataStore }
