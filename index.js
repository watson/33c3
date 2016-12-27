#!/usr/bin/env node
'use strict'

var fs = require('fs')
var xml2js = require('xml2js')
var inquirer = require('inquirer')
var ui = require('cliui')({
  width: 80
})

fs.readFile('schedule.xml', function (err, xml) {
  if (err) throw err
  xml2js.parseString(xml, function (err, result) {
    if (err) throw err
    chooseDay(result.schedule)
  })
})

function chooseDay (schedule) {
  var choices = schedule.day.map(function (_, index) {
    return {name: 'Day ' + (index + 1), value: index}
  })
  inquirer.prompt([{type: 'list', name: 'day', message: 'Choose Day', choices: choices}]).then(function (answers) {
    chooseTalk(schedule.day[answers.day])
  }).catch(function (err) {
    console.log(err)
  })
}

function chooseTalk (schedule) {
  var choices = []
  schedule.room.forEach(function (room, roomIndex) {
    // var name = room.$.name
    // console.log(name)
    if (!room.event) return
    room.event.forEach(function (event, index) {
      choices.push({name: event.start + ': ' + event.title[0], value: {room: roomIndex, event: index, date: new Date(event.date[0])}})
    })
  })

  choices = choices.sort(function (a, b) {
    return a.value.date.getTime() - b.value.date.getTime()
  })

  inquirer.prompt([{type: 'list', name: 'talk', message: 'Choose Talk', choices: choices}]).then(function (answers) {
    printTalk(schedule.room[answers.talk.room].event[answers.talk.event])
  })
}

function printTalk (talk) {
  ui.div({text: 'Room', width: 10}, {text: talk.room[0], width: 70})
  ui.div({text: 'Time', width: 10}, {text: talk.start[0], width: 70})
  ui.div({text: 'Title', width: 10}, {text: talk.title[0], width: 70})
  ui.div({text: 'Subtitle', width: 10}, {text: talk.subtitle[0], width: 70})
  ui.div({text: 'Abstract', width: 10}, {text: talk.abstract[0], width: 70})
  console.log(ui.toString())
}
