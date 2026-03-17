const fs = require('fs');
const content = fs.readFileSync('reservation_form.html', 'utf8');
const scriptStart = content.indexOf('<script>') + '<script>'.length;
const scriptEnd = content.indexOf('</script>');
const script = content.substring(scriptStart, scriptEnd);
fs.writeFileSync('test.js', script);
require('child_process').exec('node -c test.js', (err, stdout, stderr) => {
  if (err) {
    console.log('ERR:', stderr);
  } else {
    console.log('OK');
  }
});
