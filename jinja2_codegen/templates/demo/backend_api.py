import web

from backend.backend import save_state, load_state

urls = (
"/backend/save_state/" , "backend_api.BackendSaveState" ,
"/backend/load_state/" , "backend_api.BackendLoadState" ,
)


class Successful(web.HTTPError):
    def __init__(self,message,info=''):
        status = '200 '+message
        headers = {'Content-Type': 'application/json'}
        data = info
        web.HTTPError.__init__(self, status, headers, data)

#/backend/save_state/
class BackendSaveState:

    def POST(self):
        print "Save state operation"
        retval = save_state()
        if retval:
            raise Successful("Successful operation",'Saved state')

#/backend/load_state/
class BackendLoadState:

    def POST(self):
        print "Load state operation"
        retval = load_state()
        if retval:
            raise Successful("Successful operation",'Loaded state')