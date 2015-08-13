CREATE TABLE FormBuilderType_DynPropType(
	[ID] [int] IDENTITY(1,1) NOT NULL,
	FBType nvarchar(100) NOT NULL,
	FBInputPropertyName VARCHAR(100) NULL,
	FBInputPropertyValue VARCHAR(255) NULL,
	IsEXISTS BIT,
	DynPropType NVARCHAR(250) NOT NULL,
	BBEditor NVARCHAR(250) NOT NULL,
	CONSTRAINT pk_FormBuilderType_DynPropType PRIMARY KEY CLUSTERED ([ID])
) 