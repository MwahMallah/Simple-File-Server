const selector = document.querySelector("#select");
const fileContent = document.querySelector("#fileContent");
const updateBtn = document.querySelector("#updateBtn");
const deleteBtn = document.querySelector("#deleteBtn");
const addBtn = document.querySelector("#addBtn");

async function fetchSelect(fileName = null) {
    const response = await fetch("http://localhost:8000");
    const text = await response.text();
    const fileNames = text.split("\n");

    selector.innerHTML = ""; //delete all children
    for (let fileName of fileNames) {
        let option = document.createElement("option");
        option.appendChild(document.createTextNode(fileName));
        selector.appendChild(option);
    }

    if (fileName)
        selector.value = fileName
    
    await showFileContent(selector.value);
}

async function addFile(fileName) {
    const response = await fetch("http://localhost:8000");
    const text = await response.text();
    const fileNames = text.split("\n");

    if (fileNames.includes(fileName)) {
        alert("This file already exist!");
        return;
    }

    await fetch(`http://localhost:8000/${fileName}`, {
        method: "PUT"
    });

    fetchSelect(fileName);
}

async function showFileContent(fileName) {
    const response = await fetch(`http://localhost:8000/${fileName}`);
    const text = await response.text();

    fileContent.value = text;
}

async function updateFileContent(fileName) {
    await fetch(`http://localhost:8000/${fileName}`, {
        method: "PUT",
        body: fileContent.value
    });

    alert(`${fileName} updated`);
}

async function deleteFile(fileName) {
    await fetch(`http://localhost:8000/${fileName}`, {
        method: "DELETE",
    });

    await fetchSelect();
}

selector.addEventListener("change", async () => {
    const fileName = selector.value;
    await showFileContent(fileName);
});

addBtn.addEventListener("click", async () => {
    const fileName = prompt("Provide filename for new file");
    if (fileName) //if user provided filename
        await addFile(fileName);
});

updateBtn.addEventListener("click", async () => {
    const fileName = selector.value;
    await updateFileContent(fileName);
});

deleteBtn.addEventListener("click", async () => {
    const fileName = selector.value;
    const userConfirmed = confirm(`Are you sure you want to delete ${fileName}?`);
    
    if (userConfirmed) 
        await deleteFile(fileName); 
});

await fetchSelect();