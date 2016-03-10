import web
import thread
{% if notifications %}
from notification_factory import NotificationServerFactory
{% endif %}
## EXAMPLE IMPORT SERVER MODELS
{% for import_object in import_list %}
import {{import_object.name}}
{% endfor %}

{% if notifications %}
def launch_notification_server():
    return thread.start_new_thread(NotificationServerFactory,())
{% endif %}

class MyApplication(web.application):
    def run(self, port={{port}}, *middleware):
        func = self.wsgifunc(*middleware)
        return web.httpserver.runsimple(func, ('0.0.0.0', port))

##EXAMPLE import urls in the server
urls = {{urls_list|join(' + ')}}
app = MyApplication(urls, globals())

if __name__ == "__main__":
    {% if notifications %}
    nf = launch_notification_server()
    {% endif %}
    app.run({{port}})