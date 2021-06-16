(() => {
  fetch('../config.json')
    .then(res => res.json())
    .then(config => {
      document.getElementById("environMapperLink").href = config['enviroMapperURL'];
    });
})();