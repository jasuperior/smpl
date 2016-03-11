pattern jamel ( nothing special ) => { your mom }
capture variable ( var $name:lit ) => { $name }
pattern ( hello $name:variable ) => {
    welcome($name)
}
var jamel = 10;
hello jamel;
