document.getElementById('signup').addEventListener('submit', function (e) {
  e.preventDefault()
  var data = new FormData(e.target)
  // validator is never defined anywhere -> ReferenceError, swallowed silently
  if (validator.check(data.get('email'))) {
    document.getElementById('status').textContent = 'Account created'
  }
})
