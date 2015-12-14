var express = require('express'),
    User = require('../models/User'),
    Todo = require('../models/Todo'),
    Question = require('../models/Question'),
    Answer = require('../models/Answer');
var router = express.Router();

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', '설문지를 만들려면 로그인이 필요합니다.');
    res.redirect('/signin');
  }
}

router.get('/', needAuth, function(req, res, next) {
  Todo.find({user_id: req.user.id}, function(err, todos) {
    if (err) {
      return next(err);
    }
    res.render('todos/index', {todos: todos});
  });
});


router.get('/new', function(req, res, next){
    res.render('todos/new', {todo:{}});
});

router.post('/', function(req, res, next){
  var todo = new Todo({
    user_id: req.user.id,
    title: req.body.title,
    content: req.body.content
  });
  todo.save(function(err, doc){
    if (err) {
      return next(err);
    }
    res.redirect('/todos/' + doc.id);
  });
});

router.get('/:id', function(req, res, next){
  Todo.findById(req.params.id, function(err, todo){
    if (err) {
      return next(err);
    }
    Question.find({todo_id: todo.id}, function(err, questions) {
    if (err) {
      return next(err);
    }
      res.render('todos/shows', {todo: todo, questions: questions});
   });
  });
});

//수정
router.get('/:id/edit', function(req, res, next) {
  Todo.findById(req.params.id, function(err, todo) {
    if(err) {
      return next(err);
    }
    res.render('todos/new', {todo: todo});
  });
});

//설문지 수정했으니 다시 추가
router.put('/:id', function(req, res, next) {
  Todo.findById(req.params.id, function(err, todo) {
    if (err) {
      return next(err);
    }
    todo.title = req.body.title;
    todo.content = req.body.content;

    todo.save(function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', '설문지가 수정되었습니다.');
      res.redirect('/todos');
    });
  });
});


// 질문 수정
router.get('/question/:id/edit', function(req, res, next) {
  Question.findById(req.params.id, function(err, question) {
    if (err) {
      return next(err);
    }
    res.render('todos/edit', {question: question});
  });
});

router.put('/question/:id', function(req, res, next) {
  Question.findById(req.params.id, function(err, question) {
    if (err) {
      return next(err);
    }
    question.content = req.body.content;
    question.selection[0].selection1 = req.body.selection1;
    question.selection[0].selection2 = req.body.selection2;
    question.selection[0].selection3 = req.body.selection3;
    question.selection[0].selection4 = req.body.selection4;
    question.selection[0].selection5 = req.body.selection5;

    question.save(function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', '질문이 수정되었습니다.');
      res.redirect('/todos/' + question.todo_id);
    });
  });
});

//설문지 삭제
router.delete('/:id', function(req, res, next) {
  Todo.findOneAndRemove({_id:req.params.id}, function(err) {
    if (err) {
      return next(err);
    }
    //find -> findById
    Question.find({todo_id: req.params.id}).remove(function(err, questions) {
      if (err) {
          return next(err);
        }
      });
  });
    req.flash('success', '설문지가 삭제되었습니다.');
    res.redirect('/todos');
});

// 질문 삭제
router.delete('/question/:id', function(req, res, next) {
  Question.findOneAndRemove({_id: req.params.id}, function(err, question) {
    if (err) {
      return next(err);
    }
    Question.find({seq: {$gt: question.seq}}, function(err, questions) {
      if (err) {
        return next(err);
      }
      for(var i=0; i<questions.length; i++) {
        questions[i].seq = questions[i].seq-1;
        questions[i].save();
      }
    });
    Todo.findByIdAndUpdate(question.todo_id, {$inc: {numQuestion: -1}}, function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', '질문이 삭제되었습니다.');
      res.redirect('/todos/' + question.todo_id);
    });
  });
});

// 새로운 질문 추가
router.post('/:id/questions', function(req, res, next) {
  var question = new Question({
    todo_id: req.params.id,
    content: req.body.content,
    type: req.body.type
  });
  question.selection.push({
    selection1: req.body.selection1,
    selection2: req.body.selection2,
    selection3: req.body.selection3,
    selection4: req.body.selection4,
    selection5: req.body.selection5

  });

  question.save(function(err){
    if (err) {
      return next(err);
    }
    Todo.findByIdAndUpdate(req.params.id, {$inc: {numQuestion: 1}}, function(err, todo) {
      if (err) {
        return next(err);
      }
      question.seq = todo.numQuestion+1;
      question.save(function(err) {
        if (err) {
          return next(err);
        }
      });
      req.flash('success', '질문이 등록되었습니다.');
      res.redirect('/todos/' + req.params.id);
    });
  });
});

/* SHOW survey set*/
router.get('/:id/set', function(req, res, next) {
  Todo.findById(req.params.id, function(err, todo) {
    if (err) {
      return next(err);
    }
    Question.find({todo_id: todo.id}, function(err, questions) {
      if (err) {
        return next(err);
      }
      res.render('todos/set', {todo: todo, questions: questions});
    });
  });
});

/* NEW answer*/
router.post('/:id/set/response', function(req, res, next) {
  Answer.findOne({email: req.body.email}, function(err, temp) {
    if(temp!==null) {
      req.flash('danger', '이미 응답하였습니다.');
      res.redirect('/todos/' + req.params.id + '/set');
    } else {
      Question.find({todo_id: req.params.id}, function(err, questions) {
        if (err) {
          return next(err);
        }
        var value = [];
        var key = [];
        var cnt = 0;
        for (var i in req.body)
        {
          key[cnt] = i;
          value[cnt] = req.body[i];
          cnt++;
        }
        var ans = '';
        var q_id = '';

        function myloop(k, callback) {
          if(k<questions.length) {
            for(var j in key) {
              if(key[j]===questions[k].id) {
                ans = value[j];
                q_id = questions[k].id;
                console.log(q_id);
              }
            }
            if(questions[k].type==='객관식') {
              console.log('1: ' + q_id);
              Answer.findOne({question_id: q_id}, function(err, temp) {
                console.log('2: ' + q_id);
                if (temp===null) {
                  temp = new Answer({
                    todo_id: req.params.id,
                    question_id: q_id,
                    email: req.body.email
                  });
                  temp.selection.push({
                    selection1: 0,
                    selection2: 0,
                    selection3: 0,
                    selection4: 0,
                    selection5: 0
                  });
                  temp.save();
                }
                if(ans===1) {
                  temp.selection[0].selection1 = temp.selection[0].selection1+1;
                } else if(ans===2) {
                  temp.selection[0].selection2 = temp.selection[0].selection2+1;
                } else if(ans===3) {
                  temp.selection[0].selection3 = temp.selection[0].selection3+1;
                } else if(ans===4) {
                  temp.selection[0].selection4 = temp.selection[0].selection4+1;
                } else if(ans===5) {
                  temp.selection[0].selection5 = temp.selection[0].selection5+1;
                }
                temp.save();
                myloop(k+1, callback);
              });
            } else {
              var answer = new Answer({
                todo_id: req.params.id,
                question_id: q_id,
                answer: ans,
                email: req.body.email
              });
              answer.save();
              myloop(k+1, callback);
            }
          } else {
            callback();
          }
        }
        myloop(0, function() {
          Todo.findByIdAndUpdate(req.params.id, {$inc: {numAnswer: 1}}, function(err, todo) {
            if (err) {
              return next(err);
            }
            res.render('todos/response');
          });
        });
      });
    }
  });
});

/* SHOW answer*/
router.get('/:id/answer', function(req, res, next) {
  Todo.findById(req.params.id, function(err, todo) {
    if (err) {
      return next(err);
    }
    Question.find({todo_id: todo.id}, function(err, questions) {
      if (err) {
        return next(err);
      }
      Answer.find({todo_id: todo.id}, function(err, answers) {
        if (err) {
          return next(err);
        }
        res.render('todos/answer', {todo: todo, questions: questions, answers: answers});
      });
    });
  });
});

module.exports = router;

/*router.get('/', function(req, res, next) {
  res.render('todos', {
    tasks: [
      //{_id: 1, content: '이런저런일1', category: '학교', priority: 3, deadline: null},
      /*{_id: 2, content: '이런저런일2', category: null, priority: 2, deadline: null},
      {_id: 3, content: '이런저런일3', category: '집', priority: 3, deadline: new Date("2015-12-25")},
      {_id: 4, content: '이런저런일4', category: '학교', priority: 1, deadline: new Date("2015-11-21")},
      {_id: 5, content: '이런저런일5', category: '집', priority: 2, deadline: null},
    ],
    categories: [
      '학교',
      '집',
    ]
  });
});

router.post('/', function(req, res, next) {
  req.flash('success', '새로운 할 일이 저장되었습니다.');
  res.redirect('/todos');
});

router.put('/:id', function(req, res, next) {
  req.flash('success', '할 일이 변경되었습니다.');
  res.redirect('/todos');
});

router.delete('/:id', function(req, res, next) {
  req.flash('success', '할 일이 삭제되었습니다.');
  res.redirect('/todos');
});

module.exports = router;*/
