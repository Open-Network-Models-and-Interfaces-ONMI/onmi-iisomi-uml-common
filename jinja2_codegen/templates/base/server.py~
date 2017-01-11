from flask import Flask
import thread
{% if notifications %}
from notification_factory import NotificationServerFactory
{% endif %}
## EXAMPLE IMPORT SERVER MODELS
{% for import_object in import_list %}
import {{import_object.name}}
{% endfor %}
import backend_api

{% if notifications %}
def launch_notification_server():
    return thread.start_new_thread(NotificationServerFactory,())
{% endif %}



app = Flask(__name__)
{% for import_object in import_list %}
app.register_blueprint(getattr({{import_object.name}}, "{{import_object.name}}"))
{% endfor %}
app.register_blueprint(getattr(backend_api, 'backend_api'))

if __name__ == "__main__":
    {% if notifications %}
    nf = launch_notification_server()
    {% endif %}
    app.run(host='0.0.0.0', port = 8080, debug=True)
    
