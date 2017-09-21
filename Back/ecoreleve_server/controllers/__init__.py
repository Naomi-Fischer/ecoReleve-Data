"""
Created on Mon Aug 25 13:18:12 2014

@author: Natural Solutions (Thomas)
"""
from sqlalchemy import (Column,
                        ForeignKey,
                        String,
                        Integer,
                        Float,
                        DateTime,
                        select,
                        join,
                        func,
                        not_,
                        exists,
                        event,
                        Table,
                        Index,
                        UniqueConstraint,
                        Table,
                        text,
                        bindparam,
                        insert,
                        desc)
from .OrmController import ClassController
import types

StationType = ClassController.StationType
print(StationType)

from functools import wraps

def patch(myClass, methodType=None):
    methodTypeDict = {'classmethod': classmethod,
                      'staticmethod': staticmethod}
    wrappingMethod = methodTypeDict.get(methodType, None)
    def real_decorator(function):
        if not wrappingMethod:
            setattr(myClass, function.__name__, types.MethodType(function, myClass))
        else:
            setattr(myClass, function.__name__, wrappingMethod(function))
    return real_decorator

Alleluhia = ClassController.Alleluhia
# print(Alleluhia)

@patch(Alleluhia)
def toto(self, hop):
    print('toto', self.__dict__, hop)
    return hop+' __ ajouter !!!! '
# print(r)
