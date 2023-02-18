const { Plugin, segment } = require('keli')

const { version } = require('./package.json')
const plugin = new Plugin('msgrecall', version)

const config = { enableGroupList: [], sendToGroup: true, sendToMainAdmin: true, sendForwardMsg: true}

plugin.onMounted((bot, admins) => {
  plugin.saveConfig(Object.assign(config, plugin.loadConfig()))

  /**
   * 保存符合条件的每一条群聊的消息
   * mid 该消息的 message_id
   * message 撤回的消息
   */
  let data = new Array();
  let mid, message;
  plugin.onGroupMessage((event) => {
    // 加个判断是因为电脑发的图片什么的属于群文件，获取不了消息(提取消息很麻烦，懒得写)
    if(event.message[0].type !== 'file'){
      mid = event.message_id;
      message = event.message;
      data.push({"message_id": mid, "message": message})
    }
    //** 每隔两分钟清理已经不能撤回的消息 */
    setTimeout(()=>data.shift(), 120000)
  })

  // 直接私聊机器人添加群聊，更方便啦~
  plugin.onAdminCmd("/msgrecall", (event, params, options) => {
    const [param, group_id] = params
    if(param === 'add'){
      config.enableGroupList.push(group_id)
      plugin.saveConfig(config)
      event.reply("[群聊反撤回]群聊添加成功，重载生效")
    } else if(param === 'delete'){
      config.enableGroupList.forEach(e => {
        if(e === group_id){
          if(~config.enableGroupList.indexOf(group_id)){
            config.enableGroupList.splice(config.enableGroupList.indexOf(group_id), 1)
            plugin.saveConfig(config)
            event.reply("[群聊反撤回]群聊删除成功，重载生效")
          } else {
            event.reply('没有找到该群号')
          }
        }
      })
    } else {
      event.reply('/msgrecall add [群号]\n/msgrecall delete [群号]')
    }
  })

  //** 群聊消息反撤回 */
  plugin.on("notice.group.recall", async event => {
    // 判断是不是 enableGroupList 里的群聊且撤回消息的不能是本机器人
    let recall_msg;
    // 先遍历数组 data
    for(let i = 0; i < data.length;i++){
      if(data[i]['message_id'] === event.message_id){
        recall_msg = data[i]['message'];
        break;
      }
    }

    // 捕捉错误
    if(recall_msg == undefined || event.user_id == bot.uin) {
      plugin.logger.warn("[群聊反撤回]: 该消息忽略，原因：1.是群文件消息;2.是机器人自己的消息;3.是机器人上线前发的消息")
      return;
    };
    // 是否将撤回消息发送至群聊
    if (config.enableGroupList.includes(event.group_id) && config.sendToGroup) {
      const message = [
        segment.at(event.user_id),
        `撤回了:\n`,
      ]
      message.push.apply(message, recall_msg);
      await bot.sendGroupMsg(event.group_id, message);
    }
    
    // 撤回的消息是否发给 mainAdmin
    if(config.sendToMainAdmin)
    {
      let msg = `--群消息反撤回--\n群聊: ${event.group_id}\n用户: ${event.user_id}`
      if(config.sendForwardMsg){
        // 获取网名
        let friendInfo = await bot.getStrangerInfo(event.user_id);
        // 合并转发
        let list = [
          {message: msg, user_id: event.user_id, nickname: friendInfo.nickname},
          {message: recall_msg, user_id: event.user_id, nickname: friendInfo.nickname}
        ];
        // 备忘：dm 为 true 为私聊消息，false 为群聊消息，QQ 底层里私聊与群聊的视频、图片、语音资源都是不一样的
        // 可能会互不兼容
        let forwardMsg = await bot.makeForwardMsg(list, "群消息反撤回", undefined, true)
        await bot.sendPrivateMsg(plugin.mainAdmin, forwardMsg)
      } else {
        await bot.sendPrivateMsg(plugin.mainAdmin, msg)
        setTimeout(()=>{bot.sendPrivateMsg(plugin.mainAdmin, recall_msg)}, 1000)
      }
    }

  })
})

module.exports = { plugin }