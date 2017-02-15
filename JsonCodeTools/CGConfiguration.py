__author__ = 'alejandroaguado'

from xml.etree import ElementTree

class CGConfiguration:

    def __init__(self, filename):
        self.document = ElementTree.parse(filename)
        root = self.document.getroot()
        tag = self.document.find('CORS')
        self.isCORS = "yes" in tag.attrib['enable']
        self.url=tag.attrib['url']
        tag = self.document.find('Authentication')
        self.isAuth = "yes" in tag.attrib['enable']
        userslist = self.document.find('userList')
        self.users={}
        for user in userslist:
            self.users[user.attrib['name']]=user.attrib['pass']