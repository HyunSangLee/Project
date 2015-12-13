var express = require('express'),
    Todo = require('../models/Todo');
var router = express.Router();

router.get('/', function(req, res, next){
  res.render('includes/todo-main', {todo: {}});
});

router.post('/', function(req, res, next){
  var todo = new Todo({
    title: req.body.title,
    explain: req.body.explain,
    question: req.body.question
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
    if (todo) {
      todo.read = todo.read + 1;
      todo.save(function(err) { });
      res.render('includes/list', {todo: todo});
    }
    return next(new Error('not found'));
  });
});

//수정
router.get('/:id/todo-main', function(req, res, next) {
  Todo.findById(req.params.id, function(err, todo) {
    if(err) {
      return next(err);
    }
    res.render('includes/todo-main', {todo: todo});
  });
});

//수정했으니 다시 추가
router.put('/:id', function(req, res, next) {
  Todo.findById(req.params.id, function(err, todo) {
    if (err) {
      return next(err);
    }
    if (req.body.title === todo.title) {
      todo.title = req.body.title;
      todo.explain = req.body.explain;
      todo.question = req.body.question;

      todo.save(function(err) {
        res.redirect('/todos/' + req.params.id);
      });
    }
    res.redirect('back');
  });
});

router.delete('/:id', function(req, res, next) {
  Todo.findOneAndRemove(req.params.id, function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/todos/');
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
