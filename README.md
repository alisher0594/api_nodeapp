# api_nodeapp

## Эндпоинты:
    GET `http://defer-nodeapp.herokuapp.com/posts.get` - загрузить все пост
    GET `http://defer-nodeapp.herokuapp.com/posts.getById?id=1` - загрузить пост по значению id
    GET `http://defer-nodeapp.herokuapp.com/posts.post?content=firstPost` - добавить пост со значением content
    GET `http://defer-nodeapp.herokuapp.com/posts.edit?id=1&content=editedPost` - изменить значение content в посте по значению id
    GET `http://defer-nodeapp.herokuapp.com/posts.delete?id=1` - удалить пост по значению id
    GET `http://defer-nodeapp.herokuapp.com/posts.restore?id=1` - востановить пост по значению id
    GET `http://defer-nodeapp.herokuapp.com/posts.like?id=1` - увеличить значение поля like на один в посте по значению id (like +1)
    GET `http://defer-nodeapp.herokuapp.com/posts.dislike?id=1` - уменьшить значение поля like на один в посте по значению id (like -1)
   
    
