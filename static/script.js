/* GLOBALS */
artifacts = {};


/* SETUP */
window.addEventListener('load', (event) => {
    reloadStoredFilesData();
});


/* FUNCTIONS */
function reloadStoredFilesData() {
    fetch("/api/files")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        })
        .then((json) => {

            for (f of json.files) {
                var fid = toFileId(f.filename);

                if (fid in artifacts && 'progress' in artifacts[fid]) {
                    console.log(f.filename + " is uploading - ignoring server version");
                    continue;
                }

                var art = {
                    filename: f.filename,
                    size: f.size
                };
                artifacts[fid] = art;
            }

            refreshArtifactListDisplay();
        });
}


function uploadFiles() {
    var filelist = document.getElementById("artifact-upload-form-files").files;

    console.log("Uploading " + filelist.length + " files")
    Array.from(filelist).forEach((file) => uploadFile(file));
}


function deleteFile(fileId) {
    if (fileId in artifacts && !("upload" in artifacts[fileId])) {
        if (confirm("Delete " + artifacts[fileId].filename + "?")) {
            console.log("Deleting " + fileId);

            fetch("/api/files/" + artifacts[fileId].filename, {method: 'DELETE'})
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                return response.json();
            })
            .then((json) => {
                console.log(json);
                delete artifacts[fileId];
                reloadStoredFilesData();
            });
        }
    } else {
        console.log("Received delete request for unexpected file " + fileId);
    }
}


function abortUpload(fileId) {
    if (fileId in artifacts && "upload" in artifacts[fileId]) {
        if (confirm("Abort upload of " + artifacts[fileId].filename + "?")) {
            console.log("Aborting " + fileId + " upload");
            artifacts[fileId].upload.abort();
        }
    } else {
        console.log("Received abort request for unexpected file " + fileId);
    }
}


function uploadFile(file) {
    var fid = toFileId(file.name);
    var art = {
        filename: file.name,
        progress: 0
    }

    var formdata = new FormData();
    formdata.append("file", file);

    art.upload = new XMLHttpRequest();
    art.upload.upload.addEventListener("progress", uploadProgressHandler.bind(null, fid), false);
    art.upload.addEventListener("load", uploadCompleteHandler.bind(null, fid), false);
    art.upload.addEventListener("error", uploadErrorHandler.bind(null, fid), false);
    art.upload.addEventListener("abort", uploadAbortHandler.bind(null, fid), false);
    art.upload.open("PUT", "api/files");
    art.upload.send(formdata);

    artifacts[fid] = art;
    refreshArtifactListDisplay();
}


function refreshArtifactListDisplay() {
    var ids = Object.keys(artifacts);
    ids.sort(filenameCompare);

    var table = document.getElementById("artifact-table-body");

    table.childNodes.forEach(c => {
        if ('dataset' in c && 'fileId' in c.dataset) {
            if (!ids.contains(c.dataset.fileId)) {
                /* remove row for file that is shown but is not on list (on server or uploading) */
                console.log("removing " + c.dataset.fileId + " row");
                table.removeChild(c);
            }
        }
    });

    for (node of table.childNodes) {
        if ('dataset' in node && 'fileId' in node.dataset) {
            if (ids[0] == node.dataset.fileId) {
                /* update content of the row */
                var fileId = ids.shift();
                var row = table.querySelector("div[data-file-id=" + fileId);
                updateArtifactRow(fileId, artifacts[fileId], row);
            } else if (filenameCompare(ids[0], node.dataset.fileId)) {
                /* add row for file that is not shown but is on list (on server or uploading) */
                var fileId = ids.shift();
                table.insertBefore(createArtifactRow(fileId, artifacts[fileId]), node);
            }
        }
    }

    var lastRow = table.querySelector("#artifact-table-extra-row");
    for (id of ids) {
        table.insertBefore(createArtifactRow(id, artifacts[id]), lastRow)
    }
}


function createArtifactRow(fileId, file) {
    var row = document.createElement("div");
    row.classList.add("artifact-table-row");
    row.dataset.fileId = fileId;

    // checkbox
    var chkboxCell = document.createElement("div");
    chkboxCell.classList.add("artifact-table-cell");
    chkboxCell.classList.add("artifact-table-cell-chkbox");
    row.appendChild(chkboxCell);

    var chkbox = document.createElement("input");
    chkbox.type = "checkbox";
    chkboxCell.appendChild(chkbox);

    // filename
    var filenameCell = document.createElement("div");
    filenameCell.classList.add("artifact-table-cell");
    filenameCell.classList.add("artifact-table-cell-filename");
    row.appendChild(filenameCell);

    filenameCell.innerHTML = file.filename;

    // progressbar
    var progressCell = document.createElement("div");
    progressCell.classList.add("artifact-table-cell");
    progressCell.classList.add("artifact-table-cell-progress");
    row.appendChild(progressCell);

    if ("progress" in file) {
        var progressBar = document.createElement("progress");
        progressBar.classList.add("artifact-progress-bar");
        progressBar.value = file.progress;
        progressBar.max = 100;
        progressCell.appendChild(progressBar);
    }

    // file size
    var sizeCell = document.createElement("div");
    sizeCell.classList.add("artifact-table-cell");
    sizeCell.classList.add("artifact-table-cell-size");
    row.appendChild(sizeCell);

    if ("size" in file) {
        sizeCell.innerHTML = fileSizeToStr(file.size);
    }

    // buttons
    var buttonsCell = document.createElement("div");
    buttonsCell.classList.add("artifact-table-cell");
    buttonsCell.classList.add("artifact-table-cell-buttons");
    row.appendChild(buttonsCell);

    var button = document.createElement("input");
    button.classList.add("artifact-button");
    button.type = "button";
    if ("progress" in file) {
        //create Cancel button
        button.value = "Abort";
        button.onclick = abortUpload.bind(null, fileId);
    } else {
        //create Delete button
        button.value = "Delete";
        button.onclick = deleteFile.bind(null, fileId);
    }
    buttonsCell.appendChild(button);

    return row;
}


function updateArtifactRow(fileId, file, row) {
    row.querySelector(".artifact-table-cell-filename").innerHTML = file.filename;

    var progressCell = row.querySelector(".artifact-table-cell-progress");
    if ("progress" in file) {
        var progressBar = row.querySelector(".artifact-progress-bar");
        if (progressBar === null) {
            progressBar = document.createElement("progress");
            progressBar.classList.add("artifact-progress-bar");
            progressBar.value = file.progress;
            progressBar.max = 100;
            progressCell.appendChild(progressBar);
        } else {
            progressBar.value = file.progress;
        }
        var button = row.querySelector(".artifact-button");
        button.value = "Abort";
        button.onclick = abortUpload.bind(null, fileId);
    } else {
        var progressBar = row.querySelector(".artifact-progress-bar");
        if (progressBar !== null) {
            progressCell.removeChild(progressBar);
        }
        var button = row.querySelector(".artifact-button");
        button.value = "Delete";
        button.onclick = deleteFile.bind(null, fileId);
    }

    var sizeCell = row.querySelector(".artifact-table-cell-size");
    if ("size" in file) {
        sizeCell.innerHTML = fileSizeToStr(file.size);
    } else {
        sizeCell.innerHTML = "";
    }
}


/* HELPERS */
function toFileId(filename) {
    return "file-" + filename.replace(/\s/g, '-').replace(/\./g, '-').replace(/\-/g, '-');
}


function fileSizeToStr(size) {
    if (size < 1024) {
        return `${size} B`;
    }
    
    size = size/1024;
    if (size < 1024) {
        return `${size.toFixed(2)} KiB`;
    }

    size = size/1024;
    if (size < 1024) {
        return `${size.toFixed(2)} MiB`;
    }

    size = size/1024;
    if (size < 1024) {
        return `${size.toFixed(2)} GiB`;
    }
}


function filenameCompare(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
}


Array.prototype.contains = function(element){
    return this.indexOf(element) > -1;
};


function uploadProgressHandler(fileId, event) {
    if (fileId in artifacts) {
        var pct = (event.loaded / event.total) * 100;

        artifacts[fileId].progress = pct;
        artifacts[fileId].size = event.loaded;
        console.log("File " + fileId + " uploaded in " + pct + "%");

        refreshArtifactListDisplay();
    } else {
        console.log("Received progress event for unknown file " + fileId);
    }
}


function uploadCompleteHandler(fileId, event) {
    if (fileId in artifacts) {
        if ("progress" in artifacts[fileId]) {
            delete artifacts[fileId].upload;
            delete artifacts[fileId].progress;
        }

        console.log("File " + fileId + " upload finished");

        reloadStoredFilesData();
    } else {
        console.log("Received complete event for unknown file " + fileId);
    }
}


function uploadErrorHandler(fileId, event) {
    if (fileId in artifacts) {
        console.log("File " + fileId + " upload failed");
        delete artifacts[fileId];

        reloadStoredFilesData();
    } else {
        console.log("Received error event for unknown file " + fileId);
    }
}


function uploadAbortHandler(fileId, event) {
    if (fileId in artifacts) {
        console.log("File " + fileId + " upload aborted");
        delete artifacts[fileId];

        reloadStoredFilesData();
    } else {
        console.log("Received abort event for unknown file " + fileId);
    }
}
