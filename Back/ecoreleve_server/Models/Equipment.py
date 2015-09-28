from ..Models import Base,DBSession,Observation
from sqlalchemy import (
    Column,
     DateTime,
     Float,
     ForeignKey,
     Index,
     Integer,
     Numeric,
     String,
     Text,
     Unicode,
     text,
     Sequence,
     Boolean,
    orm,
    and_,
    func,
    event,
    select,
    exists)
from sqlalchemy.dialects.mssql.base import BIT
from sqlalchemy.orm import relationship,aliased
from datetime import datetime
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, backref
import pyramid.httpexceptions as exc

class Equipment(Base):
    __tablename__ = 'Equipment'

    ID = Column(Integer,Sequence('Equipment__id_seq'), primary_key=True)
    FK_Sensor = Column(Integer, ForeignKey('Sensor.ID'))
    FK_Individual = Column(Integer, ForeignKey('Individual.ID'))
    # FK_MonitoredSite = Column(Integer, ForeignKey('MonitoredSite.ID'))
    FK_Observation = Column(Integer, ForeignKey('Observation.ID'))
    StartDate = Column(DateTime,default = func.now())
    Deploy = Column(Boolean)



def checkSensor(fk_sensor,equipDate):
    e1 = aliased(Equipment)
    subQuery = select([e1]).where(and_(e1.FK_Sensor == Equipment.FK_Sensor,and_(e1.StartDate>Equipment.StartDate,e1.StartDate<=equipDate)))

    query = select([Equipment]).where(and_(~exists(subQuery),and_(Equipment.StartDate<equipDate,and_(Equipment.Deploy == 1,Equipment.FK_Sensor == fk_sensor))))
    fullQuery = select([True]).where(~exists(query))

    sensorEquip = DBSession.execute(fullQuery).scalar()
    return sensorEquip

def checkIndiv(equipDate,fk_indiv):
    e1 = aliased(Equipment)
    subQuery = select([e1]).where(and_(e1.FK_Individual == Equipment.FK_Individual,and_(e1.StartDate>Equipment.StartDate,e1.StartDate<equipDate)))

    query = select([Equipment]).where(and_(~exists(subQuery),and_(Equipment.StartDate<equipDate,and_(Equipment.Deploy == 1,Equipment.FK_Individual == fk_indiv))))
    fullQuery = select([True]).where(~exists(query))

    sensorEquip = DBSession.execute(fullQuery).scalar()
    return sensorEquip

def checkEquip(fk_sensor,equipDate,fk_indiv=None,fk_site=None):
    if fk_indiv is not None:
        availableIndiv = checkIndiv(equipDate,fk_indiv)
    else:
        print('check Site')

    availableSensor = checkSensor(fk_sensor,equipDate)

    if availableIndiv and availableSensor:
        return True
    else :
        availability = {}
        if availableIndiv is None:
            availability['indiv'] = False
            if availableSensor is None:
                availability['sensor'] = False
            else :
                availability['sensor'] = True
        else:
            availability['indiv'] = True
            availability['sensor'] = False
    return availability

def existingEquipment (fk_sensor,equipDate,fk_indiv=None):
    e1 = aliased(Equipment)
    subQuery = select([e1]).where(and_(e1.FK_Individual == Equipment.FK_Individual,and_(e1.StartDate>Equipment.StartDate,e1.StartDate<=equipDate))).where(e1.FK_Sensor == Equipment.FK_Sensor)

    query = select([Equipment]).where(and_(~exists(subQuery),and_(Equipment.StartDate<=equipDate,and_(Equipment.Deploy == 1,Equipment.FK_Individual == fk_indiv)))).where(Equipment.FK_Sensor == fk_sensor)
    fullQuery = select([True]).where(exists(query))

    return DBSession.execute(fullQuery).scalar()

def alreadyUnequip (fk_sensor,equipDate,fk_indiv=None):
    e1 = aliased(Equipment)
    e2 = aliased(Equipment)
    subQueryExists = select([e1]).where(and_(e1.FK_Individual == Equipment.FK_Individual,and_(e1.StartDate>Equipment.StartDate,e1.StartDate>=equipDate))).where(e1.FK_Sensor == Equipment.FK_Sensor)


    query = select([Equipment]).where(and_(~exists(subQueryExists),and_(Equipment.StartDate<=equipDate,and_(Equipment.Deploy == 1,Equipment.FK_Individual == fk_indiv)))).where(Equipment.FK_Sensor == fk_sensor)

    subQueryUnequip = select([e2]).where(and_(e2.FK_Individual == Equipment.FK_Individual,and_(e2.StartDate>Equipment.StartDate,e2.StartDate<=equipDate))).where(e2.FK_Sensor == Equipment.FK_Sensor).where(e2.Deploy == 0)

    query = query.where(~exists(subQueryUnequip))
    fullQuery = select([True]).where(~exists(query))
    # print(fullQuery)
    return DBSession.execute(fullQuery).scalar()


def checkUnequip(fk_sensor,equipDate,fk_indiv=None):
    existing = existingEquipment(fk_sensor,equipDate,fk_indiv=fk_indiv)
    unequip = alreadyUnequip (fk_sensor,equipDate,fk_indiv=fk_indiv)

    if existing and unequip is None:
        availability = True
    else :
        availability = {}
        if existing is None:
            availability['existing equipment'] = False
            if existing:
                availability['already unequip'] = True
            else : 
                availability['already unequip'] = False
        else :
            availability['existing equipment'] = True
            availability['already unequip'] = True

    return availability

@event.listens_for(Observation.Station, 'set')
def receive_set(target, value, oldvalue, initiator):

    typeName = target.GetType().Name
    deploy = True

    if 'equip' in typeName.lower():
        equipDate = target.Station.StationDate
        try :
            fk_sensor = target.GetProperty('FK_Sensor') 
        except :
            fk_sensor = None
        try : 
            fk_indiv = target.GetProperty('FK_Individual')
        except :
            fk_indiv = None
        try : 
            fk_site = target.GetProperty('FK_MonitoredSite')
        except :
            fk_site = None
        if 'unequip' in typeName.lower():
            deploy = False
            availability = checkUnequip(fk_sensor,equipDate,fk_indiv=fk_indiv)
        else :
            availability = checkEquip(fk_sensor,equipDate,fk_indiv=fk_indiv)

        if isinstance(availability,bool):
            curEquip = Equipment(Observation= target, FK_Sensor = fk_sensor, StartDate = equipDate,FK_Individual = fk_indiv, Deploy = deploy)    #, FK_MonitoredSite = fk_site)
            target.Equipment = curEquip
        else : 
            raise(ErrorAvailable(availability))

class ErrorAvailable(Exception):
     def __init__(self, value):
         self.value = value
         print
     def __str__(self):
        return repr(self.value)