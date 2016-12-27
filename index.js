#!/usr/bin/env node
'use strict'

var fs = require('fs')
var path = require('path')
var xml2js = require('xml2js')
var inquirer = require('inquirer')
var nearest = require('nearest-date')
var cliui = require('cliui')
var argv = require('minimist')(process.argv.slice(2))

if (argv.help || argv.h) {
  help()
} else if (argv.manual || argv.m) {
  load(function (err, schedule) {
    if (err) throw err
    chooseDay(schedule)
  })
} else {
  load(function (err, schedule) {
    if (err) throw err
    schedule.day.some(function (day, index) {
      var end = new Date(day.$.end).getTime()
      if (end > Date.now()) {
        chooseTalk(schedule.day[index])
        return true
      }
    })
  })
}

function help () {
  console.log('Usage: 33c3 [options]')
  console.log()
  console.log(' --help, -h    Show this help')
  console.log(' --manual, -m  Prompt for day (default to upcoming talk)')
}

function load (cb) {
  fs.readFile(path.join(__dirname, 'schedule.xml'), function (err, xml) {
    if (err) return cb(err)
    xml2js.parseString(xml, function (err, result) {
      if (err) return cb(err)
      cb(null, result.schedule)
    })
  })
}

function chooseDay (schedule) {
  var choices = schedule.day.map(function (_, index) {
    return {name: 'Day ' + (index + 1), value: index}
  })
  var questions = [{
    type: 'list',
    name: 'day',
    message: 'Choose Day',
    choices: choices
  }]
  inquirer.prompt(questions).then(function (answers) {
    chooseTalk(schedule.day[answers.day], 0)
  }).catch(function (err) {
    console.log(err)
    process.exit(1)
  })
}

function chooseTalk (schedule, selected) {
  var choices = []
  var totalIndex = 0
  schedule.room.forEach(function (room, roomIndex) {
    if (!room.event) return
    room.event.forEach(function (event, index) {
      choices.push({name: event.start + ': ' + event.title[0], value: {room: roomIndex, event: index, date: (new Date(event.date[0])).getTime()}})
    })
  })

  choices = choices
    .sort(function (a, b) {
      return a.value.date - b.value.date
    }).map(function (choice) {
      choice.value.index = totalIndex++
      return choice
    })

  if (selected === undefined) {
    selected = nearest(choices.map(function (choice) {
      return choice.value.date
    }))
  }

  var questions = [{
    type: 'list',
    name: 'talk',
    message: 'Choose Day ' + schedule.$.index + ' Talk',
    choices: choices,
    default: selected || 0
  }]

  inquirer.prompt(questions).then(function (answers) {
    printTalk(schedule.room[answers.talk.room].event[answers.talk.event])
    chooseTalk(schedule, answers.talk.index)
  }).catch(function (err) {
    console.log(err)
    process.exit(1)
  })
}

function printTalk (talk) {
  var ui = cliui({width: 80})
  ui.div()
  ui.div({text: 'Room', width: 10}, {text: talk.room[0], width: 70})
  ui.div({text: 'Time', width: 10}, {text: talk.start[0], width: 70})
  ui.div({text: 'Title', width: 10}, {text: talk.title[0], width: 70})
  ui.div({text: 'Subtitle', width: 10}, {text: talk.subtitle[0], width: 70})
  ui.div({text: 'Abstract', width: 10}, {text: talk.abstract[0], width: 70})
  ui.div()
  console.log(ui.toString())
}
