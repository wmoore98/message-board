function submitForm(form, url, method) {
  axios({
    method,
    url,
    data: getFormData(form),
  })
    .then(({ data, status }) => {
      if (status === 200 && data === "success") {
        window.location.reload(true);
      } else {
        alert(`status: ${status}\ndata: ${data}`);
      }
    })
    .catch((error) => {
      if (error.response) {
        console.error(error.response.data);
        console.error(error.response.status);
        alert(`Operation failed: ${error.response.data}`);
      } else if (error.request) {
        console.error(error.request);
        alert("Operation failed: an error occurred. Try again later.");
      } else {
        alert(error);
      }
    });
}

function getFormData(form) {
  const results = {};
  const formData = new FormData(form);
  for (const key of formData.keys()) {
    results[key] = formData.get(key).trim();
  }
  return results;
}

function formatDateTimes() {
  const lang =
    navigator.language ||
    navigator.browserLanguage ||
    (navigator.languages || ["en"])[0];
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  document.querySelectorAll(".datetime").forEach((elem) => {
    if (elem.textContent) {
      elem.textContent = new Date(elem.textContent).toLocaleString(
        lang || "en-US",
        {
          timeZone: tz || "UTC",
          timeZoneName: "short",
        }
      );
    }
  });

  document.querySelectorAll(".date").forEach((elem) => {
    elem.textContent = new Date(elem.textContent).toLocaleDateString(
      lang || "en-US"
    );
  });
}

function getWindowDims() {
  const width =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
  const height =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  return { width, height };
}

function getEventTarget(e) {
  e = e || window.event;
  return e.target || e.srcElement;
}
