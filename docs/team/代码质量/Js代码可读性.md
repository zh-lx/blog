---
tag: ['代码规范']
---

# 10 种方法，提高你的代码可读性！

每个人都喜欢可读性高的代码，因为高可读性的代码总是能让人眼前一亮！<br>
就好比你向周围的人说：快看，老师！周围的人可能不屑一顾：老师有什么好看的？但如果你说：快看，苍老师！那可能很多人会被你这句话所吸引。一字之差，结果截然不同。<br>
代码可读性的魅力也是这样，高可读性的代码，让别人抑郁理解，能够大量减少后期的维护时间。今天总结了 10 条常用的提高代码可读性的小方法，望大家不吝赐教。

### 1.语义化命名

在声明变量时，尽量让自己的变量名称具有清晰的语义化，使他人一眼便能够看出这个变量的含义，在这种情况下，可以减少注释的使用。<br>

示例：

```javascript
// bad  别人看到会疑惑：这个list是什么的集合？
const list = ['Teacher.Cang', 'Teacher.Bo', 'Teacher.XiaoZe'];

// good 别人看到秒懂：原来是老师们的集合！
const teacherList = ['Teacher.Cang', 'Teacher.Bo', 'Teacher.XiaoZe'];
```

### 2.各种类型命名

对于不同类型的变量值，我们可以通过一定的方式，让别人一看看上去就知道他的值类型。<br>
一般来说，对于 boolean 类型或者 Array 类型的值，是最好区分的。例如：boolean 类型的值可以用 isXXX、hasXXX、canXXX 等命名；Array 类型的值可以用 xxxList、xxxArray 等方式命名。

```javascript
// bad
let belongToTeacher = true;
let teachers = ['Teacher.Cang', 'Teacher.Bo', 'Teacher.XiaoZe'];

// good
let isTeacher = true;
let teacherList = ['Teacher.Cang', 'Teacher.Bo', 'Teacher.XiaoZe'];
```

### 3.为常量声明

我们在阅读代码时，如果你突然在代码中看到一个字符串常量或者数字常量，你可能要花一定的时间去理解它的含义。如果使用`const`或者`enum`等声明一下这些常量，可读性将会有效得到提升。

示例：

```javascript
// bad  别人看到会很疑惑：这个36D的含义是什么
if (size === '36D') {
  console.log('It is my favorite');
}

// good 别人看到秒懂：36D是最喜欢的大小
const FAVORITE_SIZE = '36D';
if (size === FAVORITE_SIZE) {
  console.log('It is my favorite');
}
```

### 4.避免上下文依赖

在遍历时，很多人会通过 value、item 甚至 v 等命名代表遍历的变量，但是当上下文过长时，这样的命名可读性就会变得很差。我们要尽量做到使读者即使不了解事情的来龙去脉的情况下，也能迅速理解这个变量代表的含义，而不是迫使读者去记住逻辑的上下文。

```javascript
const teacherList = ['Teacher.Cang', 'Teacher.Bo', 'Teacher.XiaoZe'];

// bad  别人看到循环的末尾处的item时需要在去上面看上下文理解item的含义
teacherList.forEach((item) => {
  // do something
  // do something
  // do …………
  doSomethingWith(item);
});

// good 别人看到最后一眼就能明白变量的意思是老师
teacherList.forEach((teacher) => {
  // do something
  // do something
  // do …………
  doSomethingWith(teacher);
});
```

### 5.避免冗余命名

某些情况的变量命名，例如给对象的属性命名，直接命名该属性的含义即可，因为本身这个属性在对象中，无需再添加多余的前缀。

```javascript
// bad
const teacher = {
  teacherName: 'Teacher.Cang',
  teacherAge: 37,
  teacherSex: 'female',
};
console.log(person.personName);

// good
const teacher = {
  name: 'Teacher.Cang',
  age: 37,
  sex: 'female',
};
console.log(teacher.name);
```

### 6.使用参数默认值

相比短路，使用 ES6 的参数默认值能让人更轻易地理解未传参数时参数的赋默认值。

```javascript
// bad  需要多看一步才能理解是赋默认值
function getTeacherInfo(teacherName) {
  teacherName = teacherName || 'Teacher.Cang';
  // do...
}

// good 一看就能看出是赋默认值
function getTeacherInfo(teacherName = 'Teacher.Cang') {
  // do...
}
```

### 7.回调函数命名

很多人命名回调函数，尤其是为页面或者 DOM 元素等设置事件监听的回调函数时，习惯用事件的触发条件进行命名，这样做其实可读性是比较差的，别人看到只知道你出发了这个函数，但却需要花时间去理解这个函数做了什么。<br>我们在命名回调函数式，应当以函数所要执行的逻辑命名，让别人清晰地理解这个回调函数所要执行的逻辑。

```javascript
// bad  需要花时间去看代码理解这个回调函数是做什么的
<input type='button' value='提交' onClick='handleClick' />;
function handleClick() {
  // do...
}

// good 一眼就能理解这个回调函数是提交表单
<input type='button' value='提交' onClick='handleSubmitForm' />;
function handleSubmitForm() {
  // do...
}
```

### 8.减少函数的参数个数

一个函数如果参数的数量太多，使用的时候就难以记住每个参数的含义了，并且函数多个参数有顺序限制，我们在调用时需要去记住每个次序的参数的含义。通常情况下我们一个函数的参数个数在 1-2 个为佳，尽量不要超过三个。<br>
当函数的参数比较多时，我们可以将同一类的参数使用对象进行合并，然后将合并后的对象作为参数传入，这样在调用该函数时能够很清楚地理解每个参数的含义。

```javascript
// bad  调用时传的参数难以理解含义，需要记住顺序
function createTeacher(name, sex, age, height, weight) {
  // do...
}
createTeacher('Teacher.Cang', 'female', 37, 155, 45);

// good 调用时虽然写法略复杂了点，但各个参数含义一目了然，无需刻意记住顺序
function createTeacher({ name, sex, age, height, weight }) {
  // do...
}
createTeacher({
  name: 'Teacher.Cang',
  sex: 'female',
  age: 37,
  height: 155,
  weight: 45,
});
```

### 9.函数拆分

一个函数如果代码太长，那么可读性也是比较差的，我们应该尽量保持一个函数只处理一个功能，当逻辑复杂时将函数适当拆分。

```javascript
// bad
function initData() {
  let resTeacherList = axios.get('/teacher/list');
  teacherList = resTeacherList.data;
  const params = {
    pageSize: 20,
    pageNum: 1,
  };
  let resMovieList = axios.get('/movie/list', params);
  movieList = resMovieList.data;
}

// good
function getTeacherList() {
  let resTeacherList = axios.get('/teacher/list');
  teacherList = resTeacherList.data;
}
function getMovieList() {
  const params = {
    pageSize: 20,
    pageNum: 1,
  };
  let resMovieList = axios.get('/movie/list', params);
  movieList = resMovieList.data;
}
function initData() {
  getTeacherList();
  getMovieList();
}
```

### 10.注重写注释

不写注释应该是很多开发者的一个恶习，看别人不写注释的代码也是很多开发者最讨厌的事情。<br>
所以，无论是为了自己还是别人，都请注重编写注释。

```javascript
// bad  不写注释要花大量时间理解这个函数的作用
function formatNumber(num) {
  if (num < 1000) {
    return num;
  } else {
    return `${(num / 1000).toFixed(1)}k`;
  }
}

// good 有了注释函数的作用和用法一目了然
/**
 * @param num
 * @return num | x.xk
 * @example formatNumber(1000);
 * @description
 * 小于1k不转换
 * 大于1k转换为x.xk
 */
function formatNumber(num) {
  if (num < 1000) {
    return num;
  } else {
    return `${(num / 1000).toFixed(1)}k`;
  }
}
```

提高代码可读性的代码风格其实还有很多，以上笔者主要从变量命名、函数和注释三个方面，总结了 10 条比较常用的提高代码可读性的方法，希望对大家有所帮助。如有补充，欢迎评论。<br>
