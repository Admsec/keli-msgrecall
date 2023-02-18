## 群聊反撤回 for Kivibot

kivibot 的无数据库群聊反撤回插件(可以单发给管理员，让我康康撤回了什么好康的！！)

### 安装

```
/plugin add msgrecall
```

### 启用

```
/plugin on msgrecall
```

### 用法

本插件有两种启用方式

1. 私聊机器人，添加启用群聊

```
/p add [你的群号]
/p rl msgrecall

// 如果想禁用群聊，你可以这样
/p delete [你的群号]
```

2. 前往 插件目录/data/plugins/群消息反撤回/config.json 里填好相关信息

```
{
  // 启用的群聊
  "enableGroupList": [],
  // 是否跟发(有人撤回了消息后，机器人立刻跟发)
  "sendToGroup": true,
  // 是否偷偷把撤回的消息发给管理员(如有多个管理员则发给第一个)
  "sendToMainAdmin": true,
  // 私聊是否合并转发(1.1.4新增)
  "sendForwardMsg": true
}

```

### 示例

自己找个群测试就好，记得测试前填好 config.json