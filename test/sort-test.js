var arr = [
    { priority: 1 },
    { priority: 0 },
    { priority: 10 },
    { priority: 6 },
    { priority: 3 },
    { priority: 15 },
    { priority: 1 },
    { name: "jamel"}
]

arr.sort((a,b)=>a.priority-b.priority)
console.log(arr)
