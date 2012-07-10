Changes = new Meteor.Collection("changes");

if (Meteor.is_client) {
  var uuid = Meteor.uuid();
  var delay;

  function init() {
    var html_editor = document.getElementById("html_editor");
    var onChangeEnabled = true;
    
    // what to do when the editor changes?
    function on_change(m, evt) {
      while (evt) {
        if (onChangeEnabled) {
          Changes.insert({uuid: uuid,
                          editor: m.getTextArea().id, 
                          date: new Date(),
                          text: evt.text,
                          from: evt.from,
                          to: evt.to});
        }
        evt = evt.next;
      }
      clearTimeout(delay);
      delay = setTimeout(updatePreview, 300);
    }
    
    // iframe update
    function updatePreview() {
      var previewFrame = document.getElementById('preview_iframe');
      var preview =  previewFrame.contentDocument || 
        previewFrame.contentWindow.document;

      preview.open();
      // TODO: how is tinker.io doing that?
      if (html_cm.getValue() !== "") {
        preview.write(html_cm.getValue());
      }
      if (css_cm.getValue() !== "") {
        preview.write('<style>'+css_cm.getValue()+'</style>');
      }
      if (js_cm.getValue() !== "") {
        preview.write('<script>'+js_cm.getValue()+'</script>');
      }
      preview.close();
    }

    // setup codemirror editors for HTML/CSS/JS
    html_cm = CodeMirror.fromTextArea(html_editor, {
      mode: "text/html",
      tabMode: "indent",
      electricChars: true,
      indentWithTabs: false,
      indentUnit: 2,
      tabSize: 2,
      smartIndent: true,
      lineNumbers: true,
      gutter: true,
      fixedGutter: true,
      matchBrackets: true,
      theme: "ambiance",
      onChange: on_change
    });
    html_cm.focus();
    html_cm.setSelection({line: 0, ch: 0}, {line:html_cm.lineCount(), ch:0});

    var css_editor = document.getElementById("css_editor");
    css_cm = CodeMirror.fromTextArea(css_editor, {
      mode: "text/css",
      tabMode: "indent",
      electricChars: true,
      indentWithTabs: false,
      indentUnit: 2,
      tabSize: 2,
      smartIndent: true,
      lineNumbers: true,
      gutter: true,
      fixedGutter: true,
      matchBrackets: true,
      theme: "ambiance",
      onChange: on_change
    });
    css_cm.setSelection({line: 0, ch: 0}, {line:css_cm.lineCount(), ch:0});

    var js_editor = document.getElementById("js_editor");
    js_cm = CodeMirror.fromTextArea(js_editor, {
      mode: "javascript",
      tabMode: "indent",
      electricChars: true,
      indentWithTabs: false,
      indentUnit: 2,
      tabSize: 2,
      smartIndent: true,
      lineNumbers: true,
      gutter: true,
      fixedGutter: true,
      matchBrackets: true,
      theme: "ambiance",
      onChange: on_change
    });
    js_cm.setSelection({line: 0, ch: 0}, {line:js_cm.lineCount(), ch:0});

    var changes = Changes.find({}, {sort: {date: 1}});
    
    // execute the updates in the codemirror editors
    function exec (evt, editor) {
      onChangeEnabled = false;
      try {
        if (evt.uuid != uuid) {
          editor.replaceRange(evt.text.join('\n'),
                              evt.from,
                              evt.to);
        }
      } finally {
        onChangeEnabled = true;
      }
    }

    var date = 0;
    changes.forEach(function (ch) {
      console.log('bar');
      date = Math.max(new Date(ch.date).getTime(), date);
      if (ch.editor === "html_editor") {
        exec(ch, html_cm);
      } else if (ch.editor === "css_editor") {
        exec(ch, css_cm);
      } else if (ch.editor === "js_editor") {
        exec(ch, js_cm);
      }
    });
    if (date === 0) date = undefined;
    Changes.find({date: {$gt: new Date(date)},
                  uuid: {$ne: uuid}}).observe({
                    added: function (ch) {
                      if (uuid != ch.uuid) {
                        if (ch.editor === "html_editor") {
                          exec(ch, html_cm);
                        } else if (ch.editor === "css_editor") {
                          exec(ch, css_cm);
                        } else if (ch.editor === "js_editor") {
                          exec(ch, js_cm);
                        }
                      }
                    }
                  });
  }

  Meteor.startup(function () {
    init();
  });
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}